import type { SAJEventInterface } from "./event-interface";

type SAJStateFn = (event: SAJEventInterface) => void;

export class SAJToObjectTransformStream<T> extends TransformStream<SAJEventInterface, T> {
  #controller!: TransformStreamDefaultController<T>;

  constructor() {
    let controller_!: TransformStreamDefaultController<T>;
    super({
      start: (controller) => {
        controller_ = controller;
      },
      transform: (chunk) => {
        this.#state(chunk);
      },
      flush: () => {
        if (this.#stack.length !== 0) {
          throw new Error("Incomplete JSON structure");
        }
      }
    });
    this.#controller = controller_;
  }

  // ========== 状態スタックと構築スタック ==========
  #state: SAJStateFn = this.#base;
  #stack: { container: any; key?: string }[] = [];
  #current: any = undefined;

  // ========== 状態関数 ==========
  #base(event: SAJEventInterface): void {
    switch (event.name) {
      case "startObject":
        this.#current = {};
        this.#stack.push({ container: this.#current });
        this.#state = this.#inObject;
        break;

      case "startArray":
        this.#current = [];
        this.#stack.push({ container: this.#current });
        this.#state = this.#inArray;
        break;

      case "value":
        this.#controller.enqueue(event.value as T);
        break;

      default:
        throw new Error(`Unexpected ${event.name} at root`);
    }
  };

  #inObject = (event: SAJEventInterface): void => {
    const top = this.#stack[this.#stack.length - 1];

    switch (event.name) {
      case "key":
        top.key = event.key;
        this.#state = this.#inObjectExpectingValue;
        break;

      case "endObject":
        this.#stack.pop();
        const obj = top.container;
        if (this.#stack.length === 0) {
          this.#controller.enqueue(obj as T);
          this.#state = this.#done;
        } else {
          this.#attachValue(obj);
        }
        break;

      default:
        throw new Error(`Unexpected ${event.name} in object`);
    }
  };

  #inObjectExpectingValue = (event: SAJEventInterface): void => {
    const top = this.#stack[this.#stack.length - 1];
    const key = top.key!;
    const obj = top.container;

    const assign = (value: any) => {
      obj[key] = value;
      top.key = undefined;
      this.#state = this.#inObject;
    };

    switch (event.name) {
      case "value":
        assign(event.value);
        break;

      case "startObject":
        const newObj: Record<string,unknown> = {};
        obj[key] = newObj;
        this.#stack.push({ container: newObj });
        this.#state = this.#inObject;
        break;

      case "startArray":
        const newArr: unknown[] = [];
        obj[key] = newArr;
        this.#stack.push({ container: newArr });
        this.#state = this.#inArray;
        break;

      default:
        throw new Error(`Unexpected ${event.name} after key`);
    }
  };

  #inArray = (event: SAJEventInterface): void => {
    const arr = this.#stack[this.#stack.length - 1].container;

    const push = (value: unknown) => {
      arr.push(value);
    };

    switch (event.name) {
      case "value":
        push(event.value);
        break;

      case "startObject":
        const newObj: any = {};
        arr.push(newObj);
        this.#stack.push({ container: newObj });
        this.#state = this.#inObject;
        break;

      case "startArray":
        const newArr: any[] = [];
        arr.push(newArr);
        this.#stack.push({ container: newArr });
        this.#state = this.#inArray;
        break;

      case "endArray":
        this.#stack.pop();
        const finished = arr;
        if (this.#stack.length === 0) {
          this.#controller.enqueue(finished as T);
          this.#state = this.#done;
        } else {
          this.#attachValue(finished);
        }
        break;

      default:
        throw new Error(`Unexpected ${event.name} in array`);
    }
  };

  #done = (_: SAJEventInterface): void => {
    throw new Error("Unexpected event after document complete");
  };

  #attachValue(value: any) {
    const top = this.#stack[this.#stack.length - 1];
    if (Array.isArray(top.container)) {
      top.container.push(value);
      this.#state = this.#inArray;
    } else if (typeof top.container === "object") {
      const key = top.key!;
      top.container[key] = value;
      top.key = undefined;
      this.#state = this.#inObject;
    }
  }

  async value(): Promise<T> {
    for await (const value of this.readable) return value;
    throw new Error("No value emitted");
  }
}
