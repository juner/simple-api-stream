import { EndArrayEvent, EndObjectEvent, KeyEvent, StartArrayEvent, StartObjectEvent, ValueBooleanEvent, ValueNullEvent, ValueNumberEvent, ValueStringEvent } from "./event";
import { SAJEventInterface } from "./event-interface";
import { SAJResolver } from "./interface/SAJResolver";

export class ResolveToSAJReadableStream extends ReadableStream<SAJEventInterface> implements SAJResolver {
  #controller!: ReadableStreamDefaultController<SAJEventInterface>;

  constructor() {
    let controller_!: ReadableStreamDefaultController<SAJEventInterface>;

    super({
      start: (controller) => {
        controller_ = controller;
      }
    });
    this.#controller = controller_;
  }
  startObject(): void {
    this.#controller.enqueue(new StartObjectEvent());
  }
  endObject(): void {
    this.#controller.enqueue(new EndObjectEvent());
  }
  startArray(): void {
    this.#controller.enqueue(new StartArrayEvent());
  }
  endArray(): void {
    this.#controller.enqueue(new EndArrayEvent());
  }
  key(key: string): void {
    this.#controller.enqueue(new KeyEvent(key));
  }
  value<T extends "string" | "number" | "null" | "boolean">(type: T, value: { number: number; string: string; null: null; boolean: boolean; }[T]): void {
    if (type === "boolean") {
      this.#controller.enqueue(new ValueBooleanEvent(type, value as boolean));
      return;
    } else if (type === "string") {
      this.#controller.enqueue(new ValueStringEvent(type, value as string));
      return;
    } else if (type === "number") {
      this.#controller.enqueue(new ValueNumberEvent(type, value as number));
      return;
    }
    this.#controller.enqueue(new ValueNullEvent(type));
  }
  close() {
    this.#controller.close();
  }
  [Symbol.dispose]() {
    this.close();
  }
}


