import { CdataEvent, CommentEvent, DoctypePublicEvent, DoctypeSimpleEvent, DoctypeSystemEvent, EndElementEvent, StartElementEvent, TextEvent, ProcessingInstructionEvent, XMLStylesheetDeclarationEvent, XMLDeclarationEvent } from "./event";
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
  processingInstruction(...args: ConstructorParameters<typeof ProcessingInstructionEvent | typeof XMLDeclarationEvent | typeof XMLStylesheetDeclarationEvent>): void {
    if (typeof args[0] === "string") {
      this.#controller.enqueue(new ProcessingInstructionEvent(...args as ConstructorParameters<typeof ProcessingInstructionEvent>));
      return;
    }
    const options = args[0] as ConstructorParameters<typeof XMLDeclarationEvent | typeof XMLStylesheetDeclarationEvent>[0];
    if (options.target === "xml") {
      this.#controller.enqueue(new XMLDeclarationEvent(options));
      return;
    } else if (options.target === "xml-stylesheet") {
      this.#controller.enqueue(new XMLStylesheetDeclarationEvent(options));
      return;
    }
    throw new Error(`not support parameter.`, { cause: { args } });
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
