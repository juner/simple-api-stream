import { reasonToError } from "../reasonToError";
import { parseXMLChunkBuffer } from "./parseXMLChunkBuffer";
import { SimpleSAXHandler } from "./SimpleSAXHandler";

export class SimpleSAXWritableStream extends WritableStream<string> {

  constructor(handler: SimpleSAXHandler) {
    const buffer: string[] = [];
    super({
      write: (chunk: string) => {
        buffer.push(chunk);
        parseXMLChunkBuffer(buffer, handler);
      },
      close: () => {
        parseXMLChunkBuffer(buffer, handler);
      },
      abort: (reason: unknown) => {
        handler.onError?.(reasonToError(reason));
      }
    });
  }
}
