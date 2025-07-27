import { CdataEvent, CommentEvent, XMLStylesheetDeclarationEvent, DoctypePublicEvent, DoctypeSimpleEvent, DoctypeSystemEvent, EndElementEvent, StartElementEvent, TextEvent, XMLDeclarationEvent, ProcessingInstructionOtherEvent, SAX_XML_DECLARATION_TARGET_TYPE, SAX_XML_DECLARATION_STYLESHEET_TARGET_TYPE } from "./event";
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
  processingInstruction(options: ConstructorParameters<typeof XMLDeclarationEvent>[0]): void;
  processingInstruction(options: ConstructorParameters<typeof XMLStylesheetDeclarationEvent>[0]): void
  processingInstruction(options: ConstructorParameters<typeof ProcessingInstructionOtherEvent>[0]): void
  processingInstruction(options: ConstructorParameters<typeof ProcessingInstructionOtherEvent | typeof XMLDeclarationEvent | typeof XMLStylesheetDeclarationEvent>[0]): void {
    if (options.target === "xml"){
      options
    }
  }

  cdata(...args: ConstructorParameters<typeof CdataEvent>): void {
    this.#controller.enqueue(new CdataEvent(...args));
  }

  comment(...args: ConstructorParameters<typeof CommentEvent>): void {
    this.#controller.enqueue(new CommentEvent(...args));
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

  close() {
    this.#controller.close();
  }

  [Symbol.dispose]() {
    this.close();
  }
}
