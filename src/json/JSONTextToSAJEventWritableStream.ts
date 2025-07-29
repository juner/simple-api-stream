import { SAJHandler } from "./interface/SAJHandler";
import { JSONTextToSAJParser } from "./JSONTextToSAJParser";

export class JSONTextToSAJEventWritableStream extends WritableStream<string> {

  constructor(handler: Partial<SAJHandler>) {
    const buffer = new JSONTextToSAJParser({ handler });
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
  }
}
