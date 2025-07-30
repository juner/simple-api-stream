import type { SAJEventInterface } from "./event-interface";

const NON = Symbol.for("SAJToObjectTransform.NON");

export class SAJToObjectTransform<T> extends TransformStream<SAJEventInterface, T> {
  #controller!:TransformStreamDefaultController<T>;
  constructor() {
    let controller_!: TransformStreamDefaultController<T>;
    super({
      start: (controller) => {
        controller_ = controller;
      },
     transform: (chunk) => {
        this.#handleEvent(chunk);
      },
      flush: () => {
        this.#finalize();
      }
    });
    this.#controller = controller_;
  }

  #stack: unknown[] = [];
  #keyStack: (string | typeof NON)[] = [];
  #current: unknown = NON;

  #handleEvent(event: SAJEventInterface): void {
    switch (event.name) {
      case "startObject":
        this.#stack.push(this.#current);
        this.#current = {};
        this.#keyStack.push(NON);
        break;

      case "endObject": {
        const finished = this.#current;
        this.#current = this.#stack.pop();
        const lastKey = this.#keyStack.pop();

        if (Array.isArray(this.#current)) {
          this.#current.push(finished);
        } else if (this.#current && typeof this.#current === "object" && lastKey && lastKey !== NON) {
          (this.#current as Record<string, unknown>)[lastKey] = finished;
        } else {
          // 完成したトップレベルオブジェクト
          this.#controller.enqueue(finished as T);
        }
        break;
      }

      case "startArray":
        this.#stack.push(this.#current);
        this.#current = [];
        this.#keyStack.push(NON);
        break;

      case "endArray": {
        const finished = this.#current;
        this.#current = this.#stack.pop();
        const lastKey = this.#keyStack.pop();

        if (Array.isArray(this.#current)) {
          this.#current.push(finished);
        } else if (this.#current && typeof this.#current === "object" && lastKey && lastKey !== NON) {
          (this.#current as Record<string, unknown>)[lastKey] = finished;
        } else {
          this.#controller.enqueue(finished as T);
        }
        break;
      }

      case "key":
        this.#keyStack.pop();
        this.#keyStack.push(event.key);
        break;
      case "value": {
        const value = event.type === "null" ? null : event.value;
        const currentKey = this.#keyStack[this.#keyStack.length - 1];
        if (Array.isArray(this.#current)) {
          this.#current.push(value);
        } else if (this.#current && typeof this.#current === "object" && currentKey !== NON) {
          (this.#current as Record<string, unknown>)[currentKey] = value;
          this.#keyStack[this.#keyStack.length - 1] = NON;
        } else {
          // トップレベル値として直接 emit
          this.#controller.enqueue(value as T);
        }
        break;
      }
    }
  }

  #finalize() {
    // JSON が完全に解析されていればここで何もしない
    // 不完全ならエラーを投げることも検討可能
    if (this.#stack.length !== 0) {
      throw new Error("Unexpected end of input: incomplete structure.");
    }
  }

  async value(): Promise<T> {
    for await (const value of this.readable) {
      return value;
    }
    throw new Error("No value produced");
  }
}
