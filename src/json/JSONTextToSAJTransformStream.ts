import { SAJEventInterface } from "./event-interface";
import { JSONTextToSAJParser } from "./JSONTextToSAJParser";

type SAJHandler = Required<ConstructorParameters<typeof JSONTextToSAJParser>[0]["handler"]>

export class JSONTextToSAJTransformStream extends TransformStream<string, SAJEventInterface> {
  #parser: JSONTextToSAJParser;
  constructor({skipDocument, multiple, ...handler_ }: { skipDocument?: boolean, multiple?:boolean, } & Partial<Pick<SAJHandler, "onParseBefore"|"onParseAfter"|"onParseRoopAfter"|"onParseRoopBefore">> = {}) {
    let buffer!: JSONTextToSAJParser;
    super({

      /**
       * Initializes the SAJ parser with a handler that pushes parsed events
       * into the stream's output via `controller.enqueue()`.
       */
      start(controller) {
        const handler = toHandler(controller, handler_);
        buffer = new JSONTextToSAJParser({ handler, ...{skipDocument, multiple} });
      },

      /**
       * Receives a chunk of JSON text and forwards it to the SAX parser.
       */
      transform(chunk) {
        buffer.enqueue(chunk);
      },

      /**
       * Called when the writable side of the stream is closed.
       * Flushes any remaining buffered XML data through the parser.
       */
      flush() {
        buffer.flush();
      }
    });
    this.#parser = buffer;
  }
  get status() {
    return this.#parser.status;
  }
}

/**
 * controller -> handler
 * @param controller
 * @returns
 */
function toHandler(controller: TransformStreamDefaultController<SAJEventInterface>, handler: Partial<Pick<SAJHandler, "onParseBefore"|"onParseAfter"|"onParseRoopAfter"|"onParseRoopBefore">>): Partial<SAJHandler> {
  const enqueue = controller.enqueue.bind(controller) as typeof controller.enqueue;
  const error = controller.error.bind(controller) as typeof controller.error;
  const iterable = [
    makeEntry("onStartObject", enqueue),
    makeEntry("onEndObject", enqueue),
    makeEntry("onStartArray", enqueue),
    makeEntry("onEndArray", enqueue),
    makeEntry("onKey", enqueue),
    makeEntry("onValue", enqueue),
    makeEntry("onStartDocument", enqueue),
    makeEntry("onEndDocument", enqueue),
    makeEntry("onError", error),
    ...(handler.onParseAfter ? [makeEntry("onParseAfter", (arg) => handler.onParseAfter!(arg))] : []),
    ...(handler.onParseBefore ? [makeEntry("onParseBefore", (arg) => handler.onParseBefore!(arg))] : []),
    ...(handler.onParseRoopAfter ? [makeEntry("onParseRoopAfter", (arg) => handler.onParseRoopAfter!(arg))] : []),
    ...(handler.onParseRoopBefore ? [makeEntry("onParseRoopBefore", (arg) => handler.onParseRoopBefore!(arg))] : []),
  ] as const;
  return Object.fromEntries(iterable);
  function makeEntry<T extends keyof SAJHandler>(key: T, func: SAJHandler[T] ) { return [key, func] as const; };
}

