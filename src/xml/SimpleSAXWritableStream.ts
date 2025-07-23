import { ParseXMLChunkBuffer } from "./parseXMLChunkBuffer";
import { SimpleSAXHandler } from "./interface/SimpleSAXHandler";

export class SimpleSAXWritableStream extends WritableStream<string> {

  constructor(handler: Partial<SimpleSAXHandler>) {
    const buffer = new ParseXMLChunkBuffer({ handler });
    super({
      write: (chunk: string) => {
        buffer.enqueue(chunk);
      },
      close: () => {
        buffer.flush();
      },
      abort: (reason: unknown) => {
        handler.onError?.(reason);
      }
    });
  }
}
