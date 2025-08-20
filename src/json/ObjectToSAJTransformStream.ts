import { EndArrayEvent, EndDocumentEvent, EndObjectEvent, KeyEvent, StartArrayEvent, StartDocumentEvent, StartObjectEvent, ValueBooleanEvent, ValueNullEvent, ValueNumberEvent, ValueStringEvent } from "./event";
import type { SAJEventInterface } from "./event-interface";

const unSupporteds = Object.freeze({
  ignore: "ignore",
  error: "error",
  null: "null",
} as const);
type UnSupporteds = typeof unSupporteds[keyof typeof unSupporteds];
const skip = Symbol.for("ObjectToSAJTransformStream.skip");

type UnSupportedFunction = (arg: { value: unknown, skip: typeof skip }) => unknown;

type Status = {
  makeDocument: boolean;
  unSupported: ReturnType<typeof toUnsupported>;
}

export type ObjectToSAJTransformStreamOptions = {
  makeDocument?: boolean
  unSupported?: UnSupporteds | UnSupportedFunction;
};

export class ObjectToSAJTransformStreamError extends Error implements Status {
  constructor(message: string, status: Status, options?: ErrorOptions) {
    super(message, options);
    this.name = "ObjectToSAJTransformStreamError";
    this.makeDocument = status.makeDocument;
    this.unSupported = status.unSupported;
  }
  makeDocument: boolean;
  unSupported: ReturnType<typeof toUnsupported>;
}

function toUnsupported(unSupported: UnSupportedFunction | typeof skip) {
  if (unSupported === skip) return [unSupporteds.ignore, unSupported] as const;
  if (unSupported === ObjectToSAJTransformStream.unSupportedToError) return [unSupporteds.error, unSupported] as const;
  if (unSupported === ObjectToSAJTransformStream.unSupoortedToNull) return [unSupporteds.null, unSupported] as const;
  return ["custom", unSupported] as const;
};

export class ObjectToSAJTransformStream<T = unknown> extends TransformStream<T, SAJEventInterface> {
  #controller: TransformStreamDefaultController<SAJEventInterface>;
  #makeDocument: boolean;
  #unSupported: UnSupportedFunction | typeof skip;
  constructor({ makeDocument, unSupported }: ObjectToSAJTransformStreamOptions = {}) {
    let controller_!: TransformStreamDefaultController<SAJEventInterface>;
    super({
      start(controller) {
        controller_ = controller;
      },
      transform: async (chunk) => {
        await this.#addChunk(chunk);
      }
    });
    this.#controller = controller_;
    this.#makeDocument = makeDocument ?? true;
    this.#unSupported = this.#toUnspported(unSupported);
  }
  #toUnspported(unSupported?: UnSupporteds | UnSupportedFunction): UnSupportedFunction | typeof skip {
    unSupported ??= unSupporteds.ignore;
    if (unSupported === unSupporteds.ignore)
      return skip;
    if (unSupported === unSupporteds.error)
      return ObjectToSAJTransformStream.unSupportedToError;
    if (unSupported === unSupporteds.null)
      return ObjectToSAJTransformStream.unSupoortedToNull;
    return unSupported;
  }
  #status(): Status {
    return {
      makeDocument: this.#makeDocument,
      unSupported: toUnsupported(this.#unSupported)
    };
  }
  static unSupoortedToNull() {
    return null;
  }
  static unSupportedToError({ value }: Parameters<UnSupportedFunction>[0]) {
    const error =  new Error(`not support value ${value}`);
    error.name = "UnSupportedValueError";
    (error as unknown as Record<string,unknown>).value = value;
    throw error;
  }
  #makeError(message: string | Error, options?: ConstructorParameters<typeof Error>[1]) {
    if (typeof message !== "string") {
      (options ??= {}).cause ??= message;
      message = `${message?.message ?? message}`;
    }
    return new ObjectToSAJTransformStreamError(message, this.#status(), options);
  }
  async #addChunk(chunk: unknown) {
    try {
      let makeDocument = false;
      for await (const event of this.#emitValue(chunk)) {
        if (!makeDocument) {
          if (this.#makeDocument)
            this.#controller.enqueue(new StartDocumentEvent());
          makeDocument = true;
        }
        this.#controller.enqueue(event);
      }
      if (makeDocument) {
        if (this.#makeDocument)
          this.#controller.enqueue(new EndDocumentEvent());
      }
    } catch (e: unknown) {
      this.#controller.error(e);
      throw e;
    }
  }
  async *#emitUnsupported(value: unknown): AsyncGenerator<SAJEventInterface, void, void> {
    if (this.#unSupported === skip)
      return;

    let newValue: unknown;
    try {
      newValue = this.#unSupported({ value, skip });
    } catch (e: unknown) {
      throw this.#makeError(e as Error);
    }
    if (newValue === skip) return;
    yield* this.#emitValue(newValue);

  }
  async *#emitValue(value: unknown): AsyncGenerator<SAJEventInterface, void, void> {
    // #region primitive
    if (value === null || typeof value !== "object") {
      switch (typeof value) {
        case "boolean":
          yield new ValueBooleanEvent("boolean", value);
          return;
        case "number":
          yield new ValueNumberEvent("number", value);
          return;
        case "string":
          yield new ValueStringEvent("string", value);
          return;
        case "object":
          yield new ValueNullEvent("null");
          return;
      }
      yield* this.#emitUnsupported(value);
      return;
    }
    // #endregion

    // #region array and iterable
    if (Array.isArray(value)) {
      yield new StartArrayEvent();
      for (const item of value) {
        yield* this.#emitValue(item);
      }
      yield new EndArrayEvent();
      return;
    } else if ("next" in value && typeof value["next"] === "function") {
      if (Symbol.asyncIterator in value && typeof value[Symbol.asyncIterator] === "function") {
        yield new StartArrayEvent();
        for await (const item of value as AsyncGenerator) {
          yield* this.#emitValue(item);
        }
        yield new EndArrayEvent();
        return;
      } else if (Symbol.iterator in value && typeof value[Symbol.iterator] === "function") {
        yield new StartArrayEvent();
        for (const item of value as Iterable<unknown, void, void>) {
          yield* this.#emitValue(item);
        }
        yield new EndArrayEvent();
        return;
      }
    }
    // #endregion

    // #region object
    yield new StartObjectEvent();
    for (const [key, val] of Object.entries(value)) {
      let sendKey = false;
      for await (const child of this.#emitValue(val)) {
        if (!sendKey) {
          yield new KeyEvent(key);
          sendKey = true;
        }
        yield child;
      }
    }
    yield new EndObjectEvent();
    // #endregion
  }
}
