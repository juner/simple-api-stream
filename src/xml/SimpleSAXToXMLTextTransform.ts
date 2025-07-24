import type { SAXEventInterface, StartElementSAXEventInterface } from "./event-interface";
import { escape } from "./utils";
export type SimpleSAXToXMLTextTransformOptions = {
  indent: boolean;
}
export class SimpleSAXToXMLTextTransform extends TransformStream<SAXEventInterface, string> {
  constructor(options?: SimpleSAXToXMLTextTransformOptions) {
    const starts: StartElementSAXEventInterface[] = [];
    super({
      transform(chunk, controller) {
        try {
          const str = convert(chunk, starts, options);
          if (str === undefined) return;
          controller.enqueue(str);
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

function convert(chunk: SAXEventInterface, starts: StartElementSAXEventInterface[], options?: SimpleSAXToXMLTextTransformOptions): string | undefined {
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
      joins.push(`${BLOCK_PREFIX}${chunk.tagName}`);
      for (const [key, value] of Object.entries(chunk.attrs))
        joins.push(`${key}="${escape(value)}"`);
      if (chunk.selfClosing) {
        return `${joins.join(" ")}/${BLOCK_SUFFIX}`;
      }
      starts.push(chunk);
      return `${joins.join(" ")}${BLOCK_SUFFIX}`;
    }
    case "endElement": {
      const endTagName = chunk.tagName;
      const start = starts.pop();
      if (!start)
        throw new Error(`mismatch startElement not found.`, {
          cause: {
            endTagName,
            chunk,
          }
        });
      const startTagName = start.tagName;
      if (startTagName !== endTagName)
        throw new Error(`mismatch startElement tagName ${startTagName} / endTagName ${endTagName}`, {
          cause: {
            startTagName,
            endTagName,
            chunk,
            start,
          }
        });
      if (start.selfClosing) return undefined;
      return `${BLOCK_PREFIX}/${chunk.tagName}${BLOCK_SUFFIX}`;
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
