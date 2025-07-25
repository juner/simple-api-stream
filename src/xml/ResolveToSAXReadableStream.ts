import { CdataEvent, CommentEvent, DisplayingXMLEvent, DoctypePublicEvent, DoctypeSimpleEvent, DoctypeSystemEvent, EndElementEvent, StartElementEvent, TextEvent, XMLDeclarationEvent } from "./event";
import { SAXEventInterface } from "./event-interface";
import { SimpleSAXResolver } from "./interface/SimpleSAXResolver";

export class ResolveToSAXReadableStream extends ReadableStream<SAXEventInterface> implements SimpleSAXResolver {
  #controller!: ReadableStreamDefaultController<SAXEventInterface>;

  constructor() {
    let controller_!: ReadableStreamDefaultController<SAXEventInterface>;
    // super() を呼ぶ前に controller にアクセスできないため、
    // 一時的に外に取り出して参照を残す
    super({
      start: (controller) => {
        controller_ = controller;
      }
    });
    this.#controller = controller_;
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
  doctype(...args: ConstructorParameters<typeof DoctypeSimpleEvent>): void;
  doctype(...args: ConstructorParameters<typeof DoctypeSystemEvent>): void;
  doctype(...args: ConstructorParameters<typeof DoctypePublicEvent>): void;
  doctype(...args: ConstructorParameters<typeof DoctypeSimpleEvent> | ConstructorParameters<typeof DoctypeSystemEvent> | ConstructorParameters<typeof DoctypePublicEvent>): void {
    if (args[1]?.dtdType === "PUBLIC") {
      this.#controller.enqueue(new DoctypePublicEvent(...args as ConstructorParameters<typeof DoctypePublicEvent>));
    } else if (args[1]?.dtdType === "SYSTEM") {
      this.#controller.enqueue(new DoctypeSystemEvent(...args as ConstructorParameters<typeof DoctypeSystemEvent>));
    } else {
      this.#controller.enqueue(new DoctypeSimpleEvent(...args as ConstructorParameters<typeof DoctypeSimpleEvent>));
    }
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
