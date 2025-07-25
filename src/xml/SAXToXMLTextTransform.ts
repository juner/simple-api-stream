import type { CdataSAXEventInterface, CommentSAXEventInterface, DisplayingXMLEventInterface, DoctypeSAXEventInterface, EndElementSAXEventInterface, SAXEventInterface, StartElementSAXEventInterface, TextSAXEventInterface, XMLdeclarationSAXEventInterface } from "./event-interface";
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

export type SAXToXMLTextTransformOptions = {
  /**
   * indent size or indent character
   */
  indent: number | string;
  lineBreak: string;
}

/**
 * SimpleSAX to XML Text Transform
 */
export class SAXToXMLTextTransform extends TransformStream<SAXEventInterface, string> {
  #options?: Partial<SAXToXMLTextTransformOptions>;
  #prefix: string;
  #suffix: string;
  #starts: StartElementSAXEventInterface[];
  constructor(options?: Partial<SAXToXMLTextTransformOptions>) {
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
    this.#suffix = options?.lineBreak ?? "";
  }
  #makeIndent(num: number = 0) {
    console.assert(num >= 0);
    const indent = this.#options?.indent;
    if (indent === undefined) return "";
    return (typeof indent === "string"
      ? (num == 0 ? this.#starts : Array.from({ length: this.#starts.length + num })).map(() => indent)
      : Array.from({ length: indent + num }, () => " ")
    ).join("");
  }
  #convert(chunk: SAXEventInterface): string | undefined {
    switch (chunk.type) {
      case "cdata":
        return this.#cdata(chunk);
      case "comment":
        return this.#comment(chunk);
      case "displayingXML":
        return this.#displayingXML(chunk);
      case "doctype":
        return this.#doctype(chunk);
      case "text":
        return this.#text(chunk);
      case "xmlDeclaration":
        return this.#xmlDeclaration(chunk);
      case "startElement":
        return this.#startElement(chunk);
      case "endElement":
        return this.#endElement(chunk);
    }
  }
  #cdata(chunk: CdataSAXEventInterface) {
    return `${this.#prefix}${CDATA_PREFIX} ${chunk.cdata} ${CDATA_SUFFIX}${this.#suffix}`;
  }
  #comment(chunk: CommentSAXEventInterface) {
    return `${this.#prefix}${COMMENT_PREFIX} ${chunk.comment} ${COMMENT_SUFFIX}${this.#suffix}`;
  }
  #displayingXML(chunk: DisplayingXMLEventInterface) {
    return `${this.#prefix}${XML_STYLESHEET_DECLARATION_PREFIX} type="${chunk.contentType}" href="${chunk.href}" ${DECLARATION_SUFFIX}${this.#suffix}`;
  }
  #doctype(chunk: DoctypeSAXEventInterface) {
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
    if (chunk.declarations && chunk.declarations.length > 0) {
      const indent = this.#makeIndent(1);
      joins.push(DOCTYPE_BLOCK_START);
      joins.push(`${indent}${chunk.declarations.join(`${this.#suffix}${indent}`)}`);
      return `${this.#prefix}${joins.join(" ")}${DOCTYPE_BLOCK_SUFFIX}${this.#suffix}`;
    }
    return `${this.#prefix}${joins.join(" ")}${BLOCK_SUFFIX}${this.#suffix}`;
  }
  #text(chunk: TextSAXEventInterface) {
    return `${this.#prefix}${escape(chunk.text)}${this.#suffix}`;
  }
  #xmlDeclaration(chunk: XMLdeclarationSAXEventInterface) {
    const joins: string[] = [];
    joins.push(XML_DECLARATION_PREFIX);
    if (chunk.version)
      joins.push(`version="${chunk.version}"`);
    if (chunk.encoding)
      joins.push(`encoding="${chunk.encoding}"`);
    if ((chunk.standalone ?? "yes") !== "yes")
      joins.push(`standalone="${chunk.standalone}"`);
    joins.push(DECLARATION_SUFFIX);
    return `${this.#prefix}${joins.join(" ")}${this.#suffix}`;
  }
  #startElement(chunk: StartElementSAXEventInterface) {
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
    return `${indent}${joins.join(" ")}${BLOCK_SUFFIX}${this.#suffix}`;
  }
  #endElement(chunk: EndElementSAXEventInterface) {
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
    return `${this.#prefix}${BLOCK_PREFIX}/${chunk.tagName}${BLOCK_SUFFIX}${this.#suffix}`;
  }
}

