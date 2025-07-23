import { parseXMLChunkBuffer } from "./parseXMLChunkBuffer";
import { SimpleSAXHandler } from "./interface/SimpleSAXHandler";

export class SimpleSAXWritableStream extends WritableStream<string> {

  constructor(handler: SimpleSAXHandler) {
    let buffer: string = "";
    super({
      write: (chunk: string) => {
        buffer += chunk;
        buffer = parseXMLChunkBuffer(buffer, handler);
      },
      close: () => {
        buffer = parseXMLChunkBuffer(buffer, handler);
      },
      abort: (reason: unknown) => {
        handler.onError?.(reason);
      }
    });
  }
}
