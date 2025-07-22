import { parseXMLChunkBuffer } from "./parseXMLChunkBuffer";
import { SimpleSAXHandler } from "./SimpleSAXHandler";
import { SAXEventInterface } from "./SAXEventInterface";

export class SimpleSAXTransformStream extends TransformStream<string, SAXEventInterface> {
  constructor() {
    let handler!: SimpleSAXHandler;
    const buffer: string[] = [];
    super({
      start(controller) {
        handler = toHandler(controller);;
      },
      transform(chunk) {
        buffer.push(chunk);
        parseXMLChunkBuffer(buffer, handler);
      },
      flush() {
        parseXMLChunkBuffer(buffer, handler);
      }
    });
  }
}

/**
 * controller -> handler
 * @param controller
 * @returns
 */
function toHandler(controller: TransformStreamDefaultController<SAXEventInterface>): SimpleSAXHandler {
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
    }
  };
}
