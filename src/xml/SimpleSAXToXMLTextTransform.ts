import type { SAXEventInterface, StartElementSAXEventInterface } from "./event-interface";
import { escape } from "./utils";

const CDATA_PREFIX = "<![CDATA[";
const CDATA_SUFFIX = "]]>";
const BLOCK_PREFIX = "<";
const BLOCK_SUFFIX = ">";
const DOCTYPE_PREFIX = "<!DOCTYPE";
const DOCTYPE_BLOCK_START = "[";
const DOCTYPE_BLOCK_SUFFIX = "]>";
const XML_STYLESHEET_DECLARATION_PREFIX = "<?xml-stylesheet";
const XML_DECLARATION_PREFIX = "<?xml";
const DECLARATION_SUFFIX = "?>";
const COMMENT_PREFIX = "<!--";
const COMMENT_SUFFIX = "-->";

export type SimpleSAXToXMLTextTransformOptions = {
  /**
   * indent size or indent character
   */
  indent: number | string;
}

/**
 * SimpleSAX to XML Text Transform
 */
export class SimpleSAXToXMLTextTransform extends TransformStream<SAXEventInterface, string> {
  #options?: Partial<SimpleSAXToXMLTextTransformOptions>;
  #prefix: string;
  #starts: StartElementSAXEventInterface[];
  constructor(options?: Partial<SimpleSAXToXMLTextTransformOptions>) {
    super({
      transform: (chunk, controller) => {
        try {
          const str = this.#convert(chunk);
          if (str === undefined) return;
          controller.enqueue(str);
        } catch (e: unknown) {
          controller.error(e);
        }
      }
    });
    this.#options = options;
    this.#prefix = this.#makeIndent();
    this.#starts = [];
  }
  #makeIndent() {
    const indent = this.#options?.indent;
    if (indent === undefined) return "";
    return (typeof indent === "string"
      ? this.#starts.map(() => indent)
      : Array.from({ length: indent }, () => " ")
    ).join("");
  }
  #convert(chunk: SAXEventInterface): string | undefined {
    const type = chunk.type;
    switch (chunk.type) {
      case "cdata":
        return `${this.#prefix}${CDATA_PREFIX} ${chunk.cdata} ${CDATA_SUFFIX}`;
      case "comment":
        return `${this.#prefix}${COMMENT_PREFIX} ${chunk.comment} ${COMMENT_SUFFIX}`;
      case "displayingXML":
        return `${this.#prefix}${XML_STYLESHEET_DECLARATION_PREFIX} type="${chunk.contentType}" href="${chunk.href}" ${DECLARATION_SUFFIX}`;
      case "doctype": {
        const joins: string[] = [];
        joins.push(DOCTYPE_PREFIX);
        joins.push(chunk.root);
        if (chunk.dtdType === "PUBLIC") {
          joins.push("PUBLIC");
          joins.push(`"${chunk.identifer}"`);
          joins.push(`"${chunk.uri}"`);
        } else if (chunk.dtdType === "SYSTEM") {
          joins.push("SYSTEM");
          joins.push(`"${chunk.uri}"`);
        }
        if (chunk.declarations) {
          joins.push(DOCTYPE_BLOCK_START);
          joins.push(chunk.declarations);
          joins.push(DOCTYPE_BLOCK_SUFFIX);
        } else {
          joins.push(BLOCK_SUFFIX);
        }
        return `${this.#prefix}${joins.join(" ")}`
      }
      case "text":
        return `${this.#prefix}${escape(chunk.text)}`;
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
        return `${this.#prefix}${joins.join(" ")}`;
      }
      case "startElement": {
        const joins: string[] = [];
        joins.push(`${BLOCK_PREFIX}${chunk.tagName}`);
        if (chunk.attrs)
          for (const [key, value] of Object.entries(chunk.attrs))
            joins.push(`${key}="${escape(value)}"`);
        if (chunk.selfClosing) {
          return `${this.#prefix}${joins.join(" ")}/${BLOCK_SUFFIX}`;
        }
        const indent = this.#prefix;
        this.#starts.push(chunk);
        this.#prefix = this.#makeIndent();
        return `${indent}${joins.join(" ")}${BLOCK_SUFFIX}`;
      }
      case "endElement": {
        const endTagName = chunk.tagName;
        const start = this.#starts.pop();
        this.#prefix = this.#makeIndent();
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
        return `${this.#prefix}${BLOCK_PREFIX}/${chunk.tagName}${BLOCK_SUFFIX}`;
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
}

