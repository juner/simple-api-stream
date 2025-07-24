import { SimpleSAXParseXMLBuffer } from "./SimpleSAXParseXMLBuffer";
import { SimpleSAXHandler } from "./interface";
import { SAXEventInterface } from "./event-interface";

export class SimpleSAXTransformStream extends TransformStream<string, SAXEventInterface> {
  constructor() {
    let buffer!: SimpleSAXParseXMLBuffer;
    super({
      start(controller) {
        const handler = toHandler(controller);;
        buffer = new SimpleSAXParseXMLBuffer({handler});
      },
      transform(chunk) {
        buffer.enqueue(chunk);
      },
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
    onDoctype: (arg) => {
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
