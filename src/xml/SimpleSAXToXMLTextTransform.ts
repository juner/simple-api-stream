import type { SAXEventInterface, StartElementSAXEventInterface } from "./event-interface";
import { escape } from "./utils";

export class SimpleSAXToXMLTextTransform extends TransformStream<SAXEventInterface, string> {
  constructor() {
    const starts: StartElementSAXEventInterface[] = [];
    super({
      transform(chunk, controller) {
        try {
          controller.enqueue(convert(chunk, starts));
        } catch (e: unknown) {
          controller.error(e);
        }
      }
    });
  }
}

const CDATA_PREFIX = "<![CDATA[";
const CDATA_SUFFIX = "]]>";
const BLOCK_PREFIX = "<";
const BLOCK_SUFFIX = ">";
const XML_STYLESHEET_DECLARATION_PREFIX = "<?xml-stylesheet";
const XML_DECLARATION_PREFIX = "<?xml";
const DECLARATION_SUFFIX = "?>";
const COMMENT_PREFIX = "<!--";
const COMMENT_SUFFIX = "-->";

function convert(chunk: SAXEventInterface, starts:StartElementSAXEventInterface[]): string {
  const type = chunk.type;
  switch (chunk.type) {
    case "cdata":
      return `${CDATA_PREFIX} ${chunk.cdata} ${CDATA_SUFFIX}`;
    case "comment":
      return `${COMMENT_PREFIX} ${chunk.comment} ${COMMENT_SUFFIX}`;
    case "displayingXML":
      return `${XML_STYLESHEET_DECLARATION_PREFIX} type="${chunk.contentType}" href="${chunk.href}" ${DECLARATION_SUFFIX}`;
    case "doctype":
      return `${chunk.doctype}`;
    case "text":
      return escape(chunk.text);
    case "xmlDeclaration": {
      const joins: string[] = [];
      joins.push(XML_DECLARATION_PREFIX);
      if (chunk.version)
        joins.push(`version="${chunk.version}"`);
      if (chunk.encoding)
        joins.push(`encoding="${chunk.encoding}"`);
      if ((chunk.standalone ?? "yes") !== "yes")
        joins.push(`standalone="${chunk.standalone}"`);
      joins.push(DECLARATION_SUFFIX);
      return joins.join(" ");
    }
    case "startElement": {
      const joins: string[] = [];
      joins.push(BLOCK_PREFIX);
      joins.push(chunk.tagName);
      for (const [key, value] of Object.entries(chunk.attrs))
        joins.push(`${key}="${escape(value)}"`);
      // if (chunk.selfClosing) {
      //  joins.push(`/${BLOCK_SUFFIX}`);
      //  return joins.join(" ");
      // }
      joins.push(BLOCK_SUFFIX);
      starts.push(chunk);
      return joins.join(" ");
    }
    case "endElement": {
      return `${BLOCK_PREFIX}/ ${chunk.tagName}${BLOCK_SUFFIX}`;
    }
    default:
      throw new Error(`not support type: ${type}`, {
        cause: {
          type,
          chunk,
        }
      });
  }
}
