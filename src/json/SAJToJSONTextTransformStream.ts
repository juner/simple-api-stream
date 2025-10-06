import { toErrorMessage } from "../utils";
import type {
  KeySAJEventInterface,
  SAJEventInterface,
  ValueBooleanSAJEventInterface,
  ValueNullSAJEventInterface,
  ValueNumberSAJEventInterface,
  ValueStringSAJEventInterface,
} from "./event-interface";

type ValueSAJEventInterface =
  | ValueNumberSAJEventInterface
  | ValueBooleanSAJEventInterface
  | ValueNullSAJEventInterface
  | ValueStringSAJEventInterface;

type Status = {
  get containerStack(): Stacks[];
  get firstItemStack(): boolean[];
  get pendingValueForKey(): boolean;
  get summarize(): Summarize;
  get parts(): string[];
}

export class SAJToJSONTextTransformStreamError extends Error implements Status {
  constructor(message: string, status: Status, options?: ErrorOptions) {
    super(message, options);
    this.name = "SAJToJSONTextTransformStreamError";
    this.containerStack = status.containerStack;
    this.firstItemStack = status.firstItemStack;
    this.pendingValueForKey = status.pendingValueForKey;
    this.summarize = status.summarize;
    this.parts = status.parts;
  }
  containerStack: Stacks[];
  firstItemStack: boolean[];
  pendingValueForKey: boolean;
  summarize: Summarize;
  parts: string[];
}

export type SAJToJSONTextTransformStreamOptions = {
  /** json text is document summarize */
  summarize: boolean | Summarize;
}
const stacks = Object.freeze({
  object: "object",
  array: "array",
  document: "document",
} as const);
type Stacks = typeof stacks[keyof typeof stacks];
const summarize = Object.freeze({
  /** default type: minimal */
  default: "default",
  /** For each empty containerStack */
  normal: "normal",
  /** For each document start/end unit */
  document: "document",
} as const);
/** JSON Text summarize unit types */
type Summarize = typeof summarize[keyof typeof summarize];

export class SAJToJSONTextTransformStream extends TransformStream<SAJEventInterface, string> {
  #controller!: TransformStreamDefaultController<string>;

  /** The type of container currently nested（"object" | "array" | "document"） */
  #containerStack: Stacks[] = [];
  /** Whether it is the first element for each container (true = no element has appeared yet)*/
  #firstItemStack: boolean[] = [];
  /** Flag to suppress commas in the value/structure immediately following the key */
  #pendingValueForKey = false;
  /** JSON Text summarize unit */
  #summarize: Summarize;
  #parts: string[] = [];

  #status() {
    return {
      containerStack: structuredClone(this.#containerStack),
      firstItemStack: structuredClone(this.#firstItemStack),
      pendingValueForKey: this.#pendingValueForKey,
      summarize: this.#summarize,
      parts: structuredClone(this.#parts),
    };
  }

  get status() {
    return this.#status();
  }

  constructor({ summarize }: Partial<SAJToJSONTextTransformStreamOptions> = {}) {
    let controller_!: TransformStreamDefaultController<string>;
    super({
      start: (controller) => {
        controller_ = controller;
      },
      transform: (chunk) => {
        this.#enqueue(chunk);
      },
      flush: () => {
        // nothing special
      },
    });
    this.#controller = controller_;
    this.#summarize = this.#toSummarize(summarize);
  }
  #toSummarize(value?: SAJToJSONTextTransformStreamOptions["summarize"]): Summarize {
    if (typeof value === "boolean")
      return value ? summarize.normal : summarize.default;
    if (!value) return summarize.default;
    return value;
  }

  #enqueue(chunk: SAJEventInterface): void {
    try {
      const parts = this.#next(chunk);
      if (!parts) return;
      if (this.#summarize === summarize.default) {
        for (const part of parts) {
          this.#controller.enqueue(part);
        }
      } else {
        this.#parts.push(...parts);
      }
      if (this.#summarize === summarize.normal) {
        if (
          (
            this.#containerStack.length === 0
            || (
              this.#containerStack.at(0) === stacks.document
              && this.#containerStack.length === 1
            )
          ) && this.#parts.length > 0) {
          const json = this.#parts.splice(0, this.#parts.length).join("");
          this.#controller.enqueue(json);
        }
      }
    } catch (e: unknown) {
      this.#controller.error(e);
    }
  }

  #next(chunk: SAJEventInterface): string[] | undefined {
    switch (chunk.name) {
      case "startDocument":
        return this.#startDocument();
      case "endDocument":
        return this.#endDocument();
      case "startObject":
        return this.#startStructure("object");
      case "startArray":
        return this.#startStructure("array");
      case "endObject":
        return this.#endStructure("object");
      case "endArray":
        return this.#endStructure("array");
      case "key":
        return this.#key(chunk);
      case "value":
        return this.#value(chunk);
    }
  }
  #makeError(message: string | Error, options?: ErrorOptions) {
    ({message, options} = toErrorMessage(message, options));
    return new SAJToJSONTextTransformStreamError(message, this.#status(), options);
  }

  #startDocument(): undefined {
    if (this.#containerStack.length > 0) throw this.#makeError("invalid startDocument");
    this.#containerStack.push(stacks.document);
  }

  #startStructure(type: typeof stacks.array | typeof stacks.object): string[] {
    const out: string[] = [];
    // オブジェクト内の key の直後ならカンマは抑制（#pendingValueForKey が true）
    if (!this.#pendingValueForKey && !this.#isFirstItem()) {
      out.push(",");
    }
    out.push(type === stacks.object ? "{" : "[");
    // 新しいコンテナに入る
    this.#containerStack.push(type);
    this.#firstItemStack.push(true);
    // 直後の要素（内部）は最初なので firstItem = true のまま
    // この構造自体を出したので親側では項目を出した状態になる
    this.#markParentNotFirstItem();
    // key の直後の構造を消化したのでリセット
    this.#pendingValueForKey = false;
    return out;
  }

  #endDocument(): undefined {
    const type = stacks.document;
    const top = this.#containerStack.pop();
    if (top !== type) {
      const error = this.#makeError(`Mismatched end${type}, expected to close ${top}`);
      Object.assign(error as unknown as Record<string, unknown>, { type, top });
      throw error;
    }
    if (this.#containerStack.length > 0) throw this.#makeError("invalid endDocument");
    if (this.#summarize === summarize.document && this.#parts.length > 0) {
      const parts = this.#parts.splice(0, this.#parts.length).join("");
      this.#controller.enqueue(parts);
    }
  }

  #endStructure(type: typeof stacks.array | typeof stacks.object): string[] {
    const out: string[] = [];
    const top = this.#containerStack.pop();
    this.#firstItemStack.pop();
    if (top !== type) {
      const error = this.#makeError(`Mismatched end${type}, expected to close ${top}`);
      Object.assign(error as unknown as Record<string, unknown>, { type, top });
      throw error;
    }
    out.push(type === stacks.object ? "}" : "]");
    // この構造自体が親の中の項目なので、親ではカンマを入れるべき状態にする
    this.#markParentNotFirstItem();
    // 終了後は key の直後ではない
    this.#pendingValueForKey = false;
    return out;
  }

  #key({ key }: KeySAJEventInterface): string[] {
    if (!this.#peekContainerIsObject()) {
      const error = this.#makeError("Key event outside of object");
      Object.assign(error as unknown as Record<string, unknown>, { key });
      throw error;
    }
    const out: string[] = [];
    if (!this.#isFirstItem()) {
      out.push(",");
    }
    out.push(JSON.stringify(key) + ":");
    // key の直後の値／構造ではカンマを抑制する
    this.#pendingValueForKey = true;
    // この key:value ペア全体で最初の部分（key）を出したので current container はもう first item ではない
    this.#markNotFirstItem();
    return out;
  }

  #value(chunk: ValueSAJEventInterface): string[] {
    const out: string[] = [];

    // 通常の値（配列内またはオブジェクトの value）についてカンマ処理
    if (!this.#pendingValueForKey && !this.#isFirstItem()) {
      out.push(",");
    }

    let serialized: string;
    switch (chunk.type) {
      case "boolean":
      case "number":
        serialized = String(chunk.value);
        break;
      case "null":
        serialized = "null";
        break;
      case "string":
        serialized = JSON.stringify(chunk.value);
        break;
      default: {
        const error = this.#makeError(`Unknown value type: ${(chunk as { type: unknown }).type}`);
        Object.assign(error as unknown as Record<string, unknown>, { chunk });
        throw error;
      }
    }
    out.push(serialized);
    // この値を出したので次はカンマが必要になる
    this.#markNotFirstItem();
    // key の直後の値を消化したのでリセット
    this.#pendingValueForKey = false;
    return out;
  }

  #isFirstItem(): boolean {
    if (this.#firstItemStack.length === 0) return true;
    return this.#firstItemStack.at(-1)!;
  }

  #markNotFirstItem() {
    if (this.#firstItemStack.length === 0) return;
    this.#firstItemStack[this.#firstItemStack.length - 1] = false;
  }

  // 親コンテナがあるならそれを「最初の要素ではなくなった」とマーク（構造や値を出したときに呼ぶ）
  #markParentNotFirstItem() {
    if (this.#firstItemStack.length < 2) return;
    this.#firstItemStack[this.#firstItemStack.length - 2] = false;
  }

  #peekContainerIsObject(): boolean {
    if (this.#containerStack.length === 0) return false;
    return this.#containerStack.at(-1) === stacks.object;
  }
}
