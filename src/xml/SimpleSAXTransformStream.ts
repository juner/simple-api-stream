import { parseXMLChunkBuffer } from "./parseXMLChunkBuffer";
import { SimpleSAXHandler } from "./interface";
import { SAXEventInterface } from "./event-interface";

export class SimpleSAXTransformStream extends TransformStream<string, SAXEventInterface> {
  constructor() {
    let handler!: SimpleSAXHandler;
    let buffer: string = "";
    super({
      start(controller) {
        handler = toHandler(controller);;
      },
      transform(chunk) {
        buffer += chunk;
        buffer = parseXMLChunkBuffer(buffer, handler);
      },
      flush() {
        buffer = parseXMLChunkBuffer(buffer, handler);
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
    },
    onCdata: (arg) => {
      controller.enqueue(arg);
    },
    onComment: (arg) => {
      controller.enqueue(arg);
    },
    onDtd: (arg) => {
      controller.enqueue(arg);
    },
    onDisplayingXML: (arg) => {
      controller.enqueue(arg);
    },
    onXmlDeclaration: (arg) => {
      controller.enqueue(arg);
    },
  };
}
