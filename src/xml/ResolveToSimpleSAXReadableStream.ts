import { CdataEvent, CommentEvent, DisplayingXMLEvent, DoctypeEvent, EndElementEvent, StartElementEvent, TextEvent, XMLDeclarationEvent } from "./event";
import { SAXEventInterface } from "./event-interface";
import { SimpleSAXResolver } from "./interface/SimpleSAXResolver";

export class ResolveToSimpleSAXReadableStream extends ReadableStream<SAXEventInterface> implements SimpleSAXResolver {
  #controller!: ReadableStreamDefaultController<SAXEventInterface>;

  constructor() {
    // super() を呼ぶ前に controller にアクセスできないため、
    // 一時的に外に取り出して参照を残す
    super({
      start: (controller) => {
        this.#controller = controller;
      }
    });
  }
  cdata(...args: ConstructorParameters<typeof CdataEvent>): void {
    this.#controller.enqueue(new CdataEvent(...args));
  }
  comment(...args: ConstructorParameters<typeof CommentEvent>): void {
    this.#controller.enqueue(new CommentEvent(...args));
  }
  displayingXML(...args: ConstructorParameters<typeof DisplayingXMLEvent>): void {
    this.#controller.enqueue(new DisplayingXMLEvent(...args));
  }
  doctype(...args: ConstructorParameters<typeof DoctypeEvent>): void {
    this.#controller.enqueue(new DoctypeEvent(...args));
  }
  endElement(...args: ConstructorParameters<typeof EndElementEvent>): void {
    this.#controller.enqueue(new EndElementEvent(...args));
  }
  startElement(...args: ConstructorParameters<typeof StartElementEvent>): void {
    this.#controller.enqueue(new StartElementEvent(...args));
  }
  text(...args: ConstructorParameters<typeof TextEvent>): void {
    this.#controller.enqueue(new TextEvent(...args));
  }
  xmlDeclarationn(...args: ConstructorParameters<typeof XMLDeclarationEvent>): void {
    this.#controller.enqueue(new XMLDeclarationEvent(...args));
  }

  close() {
    this.#controller.close();
  }

  [Symbol.dispose]() {
    this.close();
  }
}
