import { XMLTextToSAXParser } from "./XMLTextToSAXParser";
import { SAXHandler } from "./interface";
import { SAXEventInterface } from "./event-interface";

/**
 * A `TransformStream` that converts streamed XML text chunks into SAX-style event objects.
 *
 * This class internally uses an `XMLTextToSAXParser` to incrementally parse incoming XML
 * text and emits corresponding `SAXEventInterface` events through the stream's output.
 *
 * It is designed for use cases where XML data is received as a stream (e.g. via network, file, or stdin),
 * and you want to transform that XML text into structured event objects in real time.
 *
 * Each emitted object conforms to one of the SAX event interfaces, such as:
 * - `StartElementEvent`
 * - `EndElementEvent`
 * - `TextEvent`
 * - `CdataEvent`
 * - `CommentEvent`
 * - `DoctypeEvent` (simple, public, or system)
 * - `ProcessingInstructionEvent`
 *
 * ## Example:
 * ```ts
 * const stream = new XMLTextToSAXTransformStream();
 * const writer = stream.writable.getWriter();
 * const reader = stream.readable.getReader();
 *
 * writer.write("<root>Hello</root>");
 * writer.close();
 *
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   console.log(value); // SAXEventInterface object
 * }
 * ```
 *
 * @see XMLTextToSAXParser
 * @see SAXHandler
 * @see SAXEventInterface
 */
export class XMLTextToSAXTransformStream extends TransformStream<string, SAXEventInterface> {
  constructor({skipDocument}: {skipDocument?: boolean} = {}) {
    let buffer!: XMLTextToSAXParser;
    super({

      /**
       * Initializes the SAX parser with a handler that pushes parsed events
       * into the stream's output via `controller.enqueue()`.
       */
      start(controller) {
        const handler = toHandler(controller);;
        buffer = new XMLTextToSAXParser({handler, skipDocument});
      },

      /**
       * Receives a chunk of XML text and forwards it to the SAX parser.
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
function toHandler(controller: TransformStreamDefaultController<SAXEventInterface>): SAXHandler {
  return {
    onStartElement: (arg) => {
      controller.enqueue(arg);
    },
    onEndElement: (arg) => {
      controller.enqueue(arg);
    },
    onText: (arg) => {
      controller.enqueue(arg);
    },
    onError: (err) => {
      controller.error(err);
    },
    onCdata: (arg) => {
      controller.enqueue(arg);
    },
    onComment: (arg) => {
      controller.enqueue(arg);
    },
    onDoctype: (arg) => {
      controller.enqueue(arg);
    },
    onProcessingInstruction: (arg) => {
      controller.enqueue(arg);
    },
    onStartDocument: (arg) => {
      controller.enqueue(arg);
    },
    onEndDocument: (arg) => {
      controller.enqueue(arg);
    },
  };
}
