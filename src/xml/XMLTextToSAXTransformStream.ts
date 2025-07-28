import { XMLTextToSAXParser } from "./XMLTextToSAXParser";
import { SimpleSAXHandler } from "./interface";
import { SAXEventInterface } from "./event-interface";

export class XMLTextToSAXTransformStream extends TransformStream<string, SAXEventInterface> {
  constructor() {
    let buffer!: XMLTextToSAXParser;
    super({
      start(controller) {
        const handler = toHandler(controller);;
        buffer = new XMLTextToSAXParser({handler});
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
    onProcessingInstruction: (arg) => {
      controller.enqueue(arg);
    },
  };
}
