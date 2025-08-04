import { makeCauseOptions } from "../util/makeCauseOptions";
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

export class SAJToJSONTextTransformStreamError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SAJToJSONTextTransformStreamError";
  }
}

export class SAJToJSONTextTransformStream extends TransformStream<SAJEventInterface, string> {
  #controller!: TransformStreamDefaultController<string>;

  // 現在ネストしているコンテナの種類（"object" | "array"）
  #containerStack: Array<"object" | "array"|"document"> = [];
  // 各コンテナごとに最初の要素かどうか（true = まだ要素出してない）
  #firstItemStack: boolean[] = [];
  // key の直後に来る値／構造はカンマを抑制するためのフラグ
  #pendingValueForKey = false;

  #status() {
    return {
      instance: this,
      containerStack: structuredClone(this.#containerStack),
      firstItemStack: structuredClone(this.#firstItemStack),
      pendingValueForKey: this.#pendingValueForKey,
    };
  }

  constructor() {
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
  }

  #enqueue(chunk: SAJEventInterface): void {
    try {
      const parts = this.#next(chunk);
      if (!parts) return;
      for (const part of parts) {
        this.#controller.enqueue(part);
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
  #makeError(message: string, options?: ErrorOptions) {
    (options ??= {}).cause = makeCauseOptions([
      {
        instance: this,
        status: this.#status(),
      },
      options?.cause
    ]);
    return new SAJToJSONTextTransformStreamError(message, options);

  }

  #startDocument(): undefined {
    this.#containerStack.push("document");
  }

  #startStructure(type: "object" | "array"): string[] {
    const out: string[] = [];
    // オブジェクト内の key の直後ならカンマは抑制（#pendingValueForKey が true）
    if (!this.#pendingValueForKey && !this.#isFirstItem()) {
      out.push(",");
    }
    out.push(type === "object" ? "{" : "[");
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

  #endDocument() :undefined {
    const type = "document";
    const top = this.#containerStack.pop();
    if (top !== type) {
      throw this.#makeError(`Mismatched end${type}, expected to close ${top}`, {
        cause: {
          type,
          top,
        }
      });
    }
  }

  #endStructure(type: "object" | "array"): string[] {
    const out: string[] = [];
    const top = this.#containerStack.pop();
    this.#firstItemStack.pop();
    if (top !== type) {
      throw this.#makeError(`Mismatched end${type}, expected to close ${top}`, {
        cause: {
          type,
          top,
        }
      });
    }
    out.push(type === "object" ? "}" : "]");
    // この構造自体が親の中の項目なので、親ではカンマを入れるべき状態にする
    this.#markParentNotFirstItem();
    // 終了後は key の直後ではない
    this.#pendingValueForKey = false;
    return out;
  }

  #key({ key }: KeySAJEventInterface): string[] {
    if (!this.#peekContainerIsObject()) {
      throw this.#makeError("Key event outside of object", {
        cause: {
          key,
        }
      });
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
      default:
        throw this.#makeError(`Unknown value type: ${(chunk as { type: unknown }).type}`, {
          cause: {
            chunk
          },
        });
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
    return this.#firstItemStack[this.#firstItemStack.length - 1];
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
    return this.#containerStack[this.#containerStack.length - 1] === "object";
  }
}
