import { SimpleSAXParseXMLBuffer } from "./XMLTextToSimpleSAXParser";
import { SimpleSAXHandler } from "./interface/SimpleSAXHandler";

export class XMLTextToSimpleSAXEventWritableStream extends WritableStream<string> {

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
