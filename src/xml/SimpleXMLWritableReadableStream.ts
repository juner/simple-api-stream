import { EndElementEvent } from "./event/EndElementEvent";
import { StartElementEvent } from "./event/StartElementEvent";
import { TextEvent } from "./event/TextEvent";

export class SimpleXMLWritableReadableStream extends ReadableStream<string> {
  #controller!: ReadableStreamDefaultController<string>;

  constructor() {
    let controllerRef: ReadableStreamDefaultController<string>;

    // super() を呼ぶ前に controller にアクセスできないため、
    // 一時的に外に取り出して参照を残す
    super({
      start(controller) {
        controllerRef = controller;
      }
    });

    this.#controller = controllerRef!;
  }

  startElement(...[name, attrs = {}, selfClosing = false]: ConstructorParameters<typeof StartElementEvent>) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => `${k}="${escapeAttr(v)}"`).join(" ");
    const tag = selfClosing
      ? `<${name}${attrStr ? " " + attrStr : ""}/>`
      : `<${name}${attrStr ? " " + attrStr : ""}>`;
    this.#controller.enqueue(tag);
  }

  endElement(...[name]: ConstructorParameters<typeof EndElementEvent>) {
    this.#controller.enqueue(`</${name}>`);
  }

  text(...[text]: ConstructorParameters<typeof TextEvent>) {
    this.#controller.enqueue(escapeText(text));
  }

  close() {
    this.#controller.close();
  }

  [Symbol.dispose]() {
    this.close();
  }
}

// エスケープ処理（再掲）
function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeText(s).replace(/"/g, "&quot;");
}
