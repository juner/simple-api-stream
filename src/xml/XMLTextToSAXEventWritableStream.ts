import { XMLTextToSAXParser } from "./XMLTextToSAXParser";
import { SAXHandler } from "./interface/SAXHandler";

/**
 * A `WritableStream` that accepts XML text chunks and emits SAX-style events
 * via the provided `SimpleSAXHandler` interface.
 *
 * Internally, this stream wraps an `XMLTextToSAXParser` instance that incrementally
 * parses XML text and triggers handler callbacks for each SAX event such as elements,
 * text nodes, comments, CDATA, DOCTYPE, and processing instructions.
 *
 * This class is useful for streaming XML parsing scenarios, especially in environments
 * where data arrives in chunks (e.g., over a network or file stream).
 *
 * ## Example:
 * ```ts
 * const stream = new XMLTextToSAXEventWritableStream({
 *   onStartElement: (e) => console.log("Start:", e.name),
 *   onText: (e) => console.log("Text:", e.text),
 *   onEndElement: (e) => console.log("End:", e.name),
 *   onError: (e) => console.error("Error:", e),
 * });
 *
 * const writer = stream.getWriter();
 * writer.write('<root>Hello</root>');
 * writer.close();
 * ```
 *
 * @example
 * const stream = new XMLTextToSAXEventWritableStream({ onText: console.log });
 * stream.getWriter().write("<message>Hello</message>");
 * stream.getWriter().close();
 *
 * @see XMLTextToSAXParser
 * @see SAXHandler
 */
export class XMLTextToSAXEventWritableStream extends WritableStream<string> {
  #buffer: XMLTextToSAXParser;
  constructor(handler: Partial<SAXHandler>, options?: { skipDocument?: boolean }) {
    const buffer = new XMLTextToSAXParser({ handler, ...(options ?? {}) });
    super({

      /**
       * Called for each written XML text chunk.
       * Delegates to the parser to enqueue and process the data.
       */
      write: (chunk: string) => {
        buffer.enqueue(chunk);
      },

      /**
       * Called when the stream is closed.
       * Flushes any remaining buffered XML data.
       */
      close: () => {
        buffer.flush();
      },

      /**
       * Called if the stream is aborted.
       * If an `onError` handler is provided, it is invoked with the abort reason.
       */
      abort: (reason: unknown) => {
        handler.onError?.(reason);
      }
    });
    this.#buffer = buffer;
  }
  get status() {
    return this.#buffer.status;
  }
}
