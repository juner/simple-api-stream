import { EndArraySAJEventInterface, EndObjectSAJEventInterface, KeySAJEventInterface, SAJEventInterface, StartArraySAJEventInterface, StartObjectSAJEventInterface, ValueBooleanSAJEventInterface, ValueNullSAJEventInterface, ValueNumberSAJEventInterface, ValueStringSAJEventInterface } from "./event-interface";
import { SAJHandler } from "./interface/SAJHandler";
import { JSONTextToSAJParser } from "./JSONTextToSAJParser";


export class JSONTextToSAJTransformStream extends TransformStream<string, SAJEventInterface> {
  constructor(options?: { skipDocument?: boolean, multiple?:boolean }) {
    let buffer!: JSONTextToSAJParser;
    super({

      /**
       * Initializes the SAJ parser with a handler that pushes parsed events
       * into the stream's output via `controller.enqueue()`.
       */
      start(controller) {
        const handler = toHandler(controller);;
        buffer = new JSONTextToSAJParser({ handler, ...(options ?? {}) });
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
  }
}

/**
 * controller -> handler
 * @param controller
 * @returns
 */
function toHandler(controller: TransformStreamDefaultController<SAJEventInterface>): SAJHandler {
  return {
    onStartObject(arg: StartObjectSAJEventInterface): void {
      controller.enqueue(arg);
    },
    onEndObject: function (arg: EndObjectSAJEventInterface): void {
      controller.enqueue(arg);
    },
    onStartArray: function (arg: StartArraySAJEventInterface): void {
      controller.enqueue(arg);
    },
    onEndArray: function (arg: EndArraySAJEventInterface): void {
      controller.enqueue(arg);
    },
    onKey: function (arg: KeySAJEventInterface): void {
      controller.enqueue(arg);
    },
    onValue: function (arg: ValueBooleanSAJEventInterface | ValueNumberSAJEventInterface | ValueStringSAJEventInterface | ValueNullSAJEventInterface): void {
      controller.enqueue(arg);
    },
    onError: function (err: unknown): void {
      controller.error(err);
    },
    onStartDocument: function (arg) {
      controller.enqueue(arg);
    },
    onEndDocument: function (arg) {
      controller.enqueue(arg);
    }
  };
}

