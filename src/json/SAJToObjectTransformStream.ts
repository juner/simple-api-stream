import type { SAJEventInterface } from "./event-interface";

type SAJStateFn = (event: SAJEventInterface) => void;

export class SAJToObjectTransformStreamError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SAJToObjectTransformStreamError";
  }
}

export type SAJToObjectTransformStreamOptions = {
  multiple: boolean;
}

export class SAJToObjectTransformStream<T> extends TransformStream<SAJEventInterface, T> {
  #controller!: TransformStreamDefaultController<T>;
  #multiple: boolean;

  constructor(options?: Partial<SAJToObjectTransformStreamOptions>) {
    let controller_!: TransformStreamDefaultController<T>;
    super({
      start: (controller) => {
        controller_ = controller;
      },
      transform: (chunk) => {
        this.#next(chunk);
      },
      flush: () => {
        if (this.#stack.length === 0) return;
        throw this.#makeError("Incomplete JSON structure");
      }
    });
    ({ multiple: this.#multiple = false } = options ?? {})
    this.#controller = controller_;
  }


  #makeError(message: string, options?: ErrorOptions) {
    const cause = {
      instance: this,
      status: this.#status(),
      ...(options?.cause ?? {})
    };
    (options ??= {}).cause = cause;
    return new SAJToObjectTransformStreamError(message, options);
  }

  #status() {
    return {
      state: stateToName(this.#state),
      stack: structuredClone(this.#stack),
      current: structuredClone(this.#current),
    };
    function stateToName(state: SAJStateFn) {
      if (state.name.startsWith("#"))
        return state.name.slice(1);
      return state.name;
    }
  }
  #next(chunk: SAJEventInterface) {
    try {
      this.#state(chunk);
    }catch(e:unknown) {
      this.#controller.error(e);
    }
  }
  // ========== 状態スタックと構築スタック ==========
  #state: SAJStateFn = this.#startEntry;
  #stack: { container: unknown; key?: string }[] = [];
  #current: unknown = undefined;

  // #region 状態関数
  #startEntry(event: SAJEventInterface): void {
    switch (event.name) {
      case "startObject":
        this.#current = {};
        this.#stack.push({ container: this.#current });
        this.#state = this.#inObject;
        return;

      case "startArray":
        this.#current = [];
        this.#stack.push({ container: this.#current });
        this.#state = this.#inArray;
        return;

      case "value":
        this.#endEntry(event.value as T);
        return;
    }

    throw this.#makeError(`Unexpected ${event.name} at root`, {
      cause: {
        name: event.name,
      }
    });
  }

  #inObject(event: SAJEventInterface): void {
    const top = this.#stack[this.#stack.length - 1];

    switch (event.name) {
      case "key":
        top.key = event.key;
        this.#state = this.#inObjectExpectingValue;
        return;

      case "endObject":
        this.#stack.pop();
        const obj = top.container;
        if (this.#stack.length > 0) {
          this.#attachValue(obj);
          return;
        }
        this.#endEntry(obj);
        return;
    }
    throw this.#makeError(`Unexpected ${event.name} in object`, {
      cause: {
        name: event.name,
      }
    });
  }

  #inObjectExpectingValue(event: SAJEventInterface): void {
    const top = this.#stack[this.#stack.length - 1];
    const key = top.key!;
    const obj = top.container as Record<string, unknown>;

    switch (event.name) {
      case "value":
        obj[key] = event.value;
        top.key = undefined;
        this.#state = this.#inObject;
        return;

      case "startObject":
        const newObj: Record<string, unknown> = {};
        obj[key] = newObj;
        this.#stack.push({ container: newObj });
        this.#state = this.#inObject;
        return;

      case "startArray":
        const newArr: unknown[] = [];
        obj[key] = newArr;
        this.#stack.push({ container: newArr });
        this.#state = this.#inArray;
        return;
    }
    throw this.#makeError(`Unexpected ${event.name} after key`);
  }

  #inArray(event: SAJEventInterface): void {
    const arr = this.#stack[this.#stack.length - 1].container as unknown[];

    switch (event.name) {
      case "value":
        arr.push(event.value);
        return;

      case "startObject":
        const newObj: unknown = {};
        arr.push(newObj);
        this.#stack.push({ container: newObj });
        this.#state = this.#inObject;
        return;

      case "startArray":
        const newArr: unknown[] = [];
        arr.push(newArr);
        this.#stack.push({ container: newArr });
        this.#state = this.#inArray;
        return;

      case "endArray":
        this.#stack.pop();
        const finished = arr;
        if (this.#stack.length > 0) {
          this.#attachValue(finished);
          return;
        }
        this.#endEntry(finished);
        return;
    }
    throw this.#makeError(`Unexpected ${event.name} in array`);
  }

  #done(_: SAJEventInterface): void {
    throw this.#makeError("Unexpected event after document complete");
  };

  // #endregion

  #endEntry(finished: unknown) {
    this.#controller.enqueue(finished as T);
    this.#state = this.#multiple ? this.#startEntry : this.#done;
  }

  #attachValue(value: unknown) {
    const top = this.#stack[this.#stack.length - 1];
    if (Array.isArray(top.container)) {
      top.container.push(value);
      this.#state = this.#inArray;
      return;
    }
    if (top.container && typeof top.container === "object") {
      const key = top.key!;
      (top.container as Record<string, unknown>)[key] = value;
      top.key = undefined;
      this.#state = this.#inObject;
      return;
    }
  }

  async value(): Promise<T> {
    for await (const value of this.readable) return value;
    throw this.#makeError("No value emitted");
  }
  async *values() {
    for await (const value of this.readable)
      yield value;
  }
}
