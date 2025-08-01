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

export class SAJToJSONTextTransformStream extends TransformStream<SAJEventInterface, string> {
  #controller!: TransformStreamDefaultController<string>;
  #stack: Array<"object" | "array"> = [];
  #commaStack: boolean[] = []; // true if comma needed before next item
  #keyExpected = false;

  constructor() {
    let controller_!: TransformStreamDefaultController<string>;
    super({
      start: (controller) => {
        controller_ = controller;
      },
      transform: (chunk) => {
        this.#enqueue(chunk);
      },
      flush: () => this.#flush(),
    });
    this.#controller = controller_;
  }

  #enqueue(chunk: SAJEventInterface): void {
    try {
      const str = this.#next(chunk);
      if (str !== undefined) {
        this.#controller.enqueue(str);
      }
    } catch (e: unknown) {
      this.#controller.error(e);
    }
  }

  #flush() {
    // No special action needed for flush in this case
  }

  #next(chunk: SAJEventInterface): string | undefined {
    switch (chunk.name) {
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
    return undefined;
  }

  #startStructure(type: "object" | "array"): string {
    const opening = type === "object" ? "{" : "[";
    this.#maybeComma();
    this.#stack.push(type);
    this.#commaStack.push(false);
    if (type === "object") this.#keyExpected = true;
    return opening;
  }

  #endStructure(type: "object" | "array"): string {
    const top = this.#stack.pop();
    this.#commaStack.pop();
    if (top !== type) throw new Error(`Mismatched end${type}`);
    this.#keyExpected = top === "object" && this.#stack[this.#stack.length - 1] === "object";
    return type === "object" ? "}" : "]";
  }

  #key({ key }: KeySAJEventInterface): string {
    if (!this.#keyExpected) throw new Error("Key not expected outside of object");
    this.#maybeComma();
    this.#commaStack[this.#commaStack.length - 1] = false; // key-value pair acts as one
    return JSON.stringify(key) + ":";
  }

  #value(chunk: ValueSAJEventInterface): string {
    this.#maybeComma();
    this.#commaStack[this.#commaStack.length - 1] = true;

    switch (chunk.type) {
      case "boolean":
      case "number":
        return String(chunk.value);
      case "null":
        return "null";
      case "string":
        return JSON.stringify(chunk.value);
      default:
        throw new Error(`Unknown value type: ${(chunk as any).type}`);
    }
  }

  #maybeComma() {
    const depth = this.#commaStack.length;
    if (depth > 0 && this.#commaStack[depth - 1]) {
      this.#controller.enqueue(",");
    }
    if (depth > 0) {
      this.#commaStack[depth - 1] = true;
    }
  }
}
