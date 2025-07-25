import { SimpleSAXParseXMLBuffer } from "./XMLTextToSAXParser";
import { SimpleSAXHandler } from "./interface/SimpleSAXHandler";

export class XMLTextToSAXEventWritableStream extends WritableStream<string> {

  constructor(handler: Partial<SimpleSAXHandler>) {
    const buffer = new SimpleSAXParseXMLBuffer({ handler });
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
