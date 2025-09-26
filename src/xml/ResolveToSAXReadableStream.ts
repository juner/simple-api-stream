import { toErrorMessage } from "../utils";
import { CdataEvent, CommentEvent, DoctypePublicEvent, DoctypeSimpleEvent, DoctypeSystemEvent, EndElementEvent, StartElementEvent, TextEvent, ProcessingInstructionEvent, XMLStylesheetDeclarationEvent, XMLDeclarationEvent, StartDocumentEvent, EndDocumentEvent } from "./event";
import { SAXEventInterface } from "./event-interface";
import { SAXResolver } from "./interface";

type Status = object;

export class ResolveToSAXReadableStreamError extends Error implements Status {
  constructor(message: string, _status: Status, options?: ErrorOptions) {
    super(message, options);
    this.name = "ResolveToSAXReadableStreamError";
  }
}

/**
 * A `ReadableStream` implementation that emits SAX-style XML events
 * by providing an imperative API via the `SimpleSAXResolver` interface.
 *
 * Instead of parsing XML text, this stream allows you to manually
 * emit SAX event objects (such as elements, text, CDATA, comments, etc.)
 * through method calls, which are then pushed to the readable stream.
 *
 * This is particularly useful for scenarios where you want to **programmatically construct** or
 * transform SAX event streams, rather than derive them from XML text input.
 *
 * ## Example:
 * ```ts
 * const stream = new ResolveToSAXReadableStream();
 * const reader = stream.getReader();
 *
 * stream.startElement("greeting", {});
 * stream.text("Hello");
 * stream.endElement("greeting");
 * stream.close();
 *
 * while (true) {
 *   const { value, done } = await reader.read();
 *   if (done) break;
 *   console.log(value); // instance of SAXEventInterface
 * }
 * ```
 *
 * @implements {SAXResolver}
 * @see SAXResolver
 * @see SAXEventInterface
 * @see CdataEvent
 * @see DoctypeSimpleEvent
 * @see ProcessingInstructionEvent
 * @see XMLDeclarationEvent
 * @see XMLStylesheetDeclarationEvent
 */
export class ResolveToSAXReadableStream extends ReadableStream<SAXEventInterface> implements SAXResolver {
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
  #status(): Status {
    return {};
  }

  #makeError(message: string | Error, options?: ErrorOptions) {
    ({message, options} = toErrorMessage(message, options));
    return new ResolveToSAXReadableStreamError(message, this.#status(), options);
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
    const error = this.#makeError(`not support parameter.`);
    Object.assign(error as unknown as Record<string, unknown>, { args });
    throw error;
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
  doctype(...args: ConstructorParameters<typeof DoctypeSimpleEvent | typeof DoctypeSystemEvent | typeof DoctypePublicEvent>): void {
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

  startDocument(): void {
    this.#controller.enqueue(new StartDocumentEvent());
  }

  endDocument(): void {
    this.#controller.enqueue(new EndDocumentEvent());
  }

  close() {
    this.#controller.close();
  }

  [Symbol.dispose]() {
    this.close();
  }
}
