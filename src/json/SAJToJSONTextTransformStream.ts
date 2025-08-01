import { SAJEventInterface } from "./event-interface";

export class SAJToJSONTextTransformStream extends TransformStream<SAJEventInterface, string> {
  #controller!: TransformStreamDefaultController<string>;
  constructor() {
    super({
      start: (controller) => {
        this.#controller = controller;
      },
      transform: (chunk) => {
        this.#enqueue(chunk);
      },
      flush: () => this.#flush(),
    });
  }
  #enqueue(chunk: SAJEventInterface): void {
    try {
      const str = this.#next(chunk);
      if (str === undefined) return;
      this.#controller.enqueue(str);
    } catch(e:unknown) {
      this.#controller.error(e);
    }
  }
  #flush() {

  }
  #next(chunk: SAJEventInterface): string | undefined {
    switch (chunk.name) {
      case "startObject":
        return this.#startObject();
      case "startArray":
        return this.#startArray();
      case "endArray":
        return this.#endArray();
      case "endObject":
        return this.#endObject();
      case "key":
      case "value":
    }
    return undefined;
  }
  #startObject():string | undefined {
    return "{";
  }
  #endObject(): string | undefined {
    return "}";
  }
  #startArray():string | undefined {
    return "[";
  }
  #endArray(): string | undefined {
    return "]";
  }
}
