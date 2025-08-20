import { assertIsTrue } from "../utils";
import type { CdataSAXEventInterface, CommentSAXEventInterface, DoctypeSAXEventInterface, EndElementSAXEventInterface, SAXEventInterface, StartElementSAXEventInterface, TextSAXEventInterface, ProcessingInstructionSAXEventInterface, StartDocumentSAXEventInterface, EndDocumentSAXEventInterface } from "./event-interface";
import { escape } from "./utils";

const CDATA_PREFIX = "<![CDATA[";
const CDATA_SUFFIX = "]]>";
const BLOCK_PREFIX = "<";
const BLOCK_SUFFIX = ">";
const DOCTYPE_PREFIX = "<!DOCTYPE";
const DOCTYPE_BLOCK_START = "[";
const DOCTYPE_BLOCK_SUFFIX = "]>";
const PROCESSING_INSTRUCTION_PREFIX = "<?";
const PROCESSING_INSTRUCTION_SUFFIX = "?>";
const COMMENT_PREFIX = "<!--";
const COMMENT_SUFFIX = "-->";

export type SAXToXMLTextTransformOptions = {
  /**
   * indent size or indent character
   */
  indent: number | string;
  lineBreak: string;
}

type Status = {
  options: Partial<SAXToXMLTextTransformOptions> | undefined;
  starts: (StartElementSAXEventInterface | StartDocumentSAXEventInterface)[];
  prefix: string;
  suffix: string;
}

export class SAXToXMLTextTransformStreamError extends Error implements Status {
  constructor(message: string, status: Status, options?: ErrorOptions) {
    super(message, options);
    this.name = "SAXToXMLTextTransformError";
    this.options = status.options;
    this.starts = status.starts;
    this.prefix = status.prefix;
    this.suffix = status.suffix;
  }
  options: Partial<SAXToXMLTextTransformOptions> | undefined;
  starts: (StartElementSAXEventInterface | StartDocumentSAXEventInterface)[];
  prefix: string;
  suffix: string;
}

/**
 * A `TransformStream` that converts a stream of `SAXEventInterface` objects
 * into well-formed XML text.
 *
 * This class is part of the SimpleSAX toolchain and allows serialized
 * reconstruction of XML data from SAX-style events such as element start/end,
 * character data, comments, CDATA sections, doctype declarations, and
 * processing instructions.
 *
 * ## Features:
 * - Pretty-prints output with configurable indentation and line breaks.
 * - Escapes special characters in text and attributes.
 * - Validates tag name matching for start and end elements.
 * - Supports self-closing tags and internal DTD subsets.
 *
 * ## Options:
 * - `indent`: Number of spaces or a string used for each indentation level.
 * - `lineBreak`: Line separator to use after each XML block (e.g., `"\n"`).
 *
 * ## Example:
 * ```ts
 * const transform = new SAXToXMLTextTransform({ indent: 2, lineBreak: "\n" });
 * readable.pipeThrough(transform).pipeTo(writable);
 * ```
 *
 * @throws {SAXToXMLTextTransformStreamError} If an unexpected structure or mismatch occurs.
 */
export class SAXToXMLTextTransformStream extends TransformStream<SAXEventInterface, string> {
  #options?: Partial<SAXToXMLTextTransformOptions>;
  #prefix: string;
  #suffix: string;
  #starts: (StartElementSAXEventInterface | StartDocumentSAXEventInterface)[];
  constructor(options?: Partial<SAXToXMLTextTransformOptions>) {
    super({
      transform: (chunk, controller) => {
        try {
          const str = this.#enqueue(chunk);
          if (str === undefined) return;
          controller.enqueue(str);
        } catch (e: unknown) {
          controller.error(e);
        }
      },
      flush: () => this.#flush(),
    });
    this.#options = options;
    this.#starts = [];
    this.#suffix = options?.lineBreak ?? "";
    this.#prefix = this.#makeIndent();
  }
  #status() : Status {
    return {
      options: structuredClone(this.#options),
      starts: structuredClone(this.#starts),
      prefix: this.#prefix,
      suffix: this.#suffix,
    };
  }
  #makeError(message: string, options?: ErrorOptions) {
    return new SAXToXMLTextTransformStreamError(message, this.#status(), options);
  }
  /**
   * make not complete error
   * @returns
   */
  #makeNotCompleteError() {
    return this.#makeError(`not complete error.`);
  }
  #makeIndent(num: number = 0) {
    assertIsTrue(num >= 0, "num is required 0 or later");
    const indent = this.#options?.indent;
    if (indent === undefined) return "";
    return (typeof indent === "string"
      ? (num == 0 ? this.#starts : Array.from({ length: this.#starts.length + num })).map(() => indent)
      : Array.from({ length: indent + num }, () => " ")
    ).join("");
  }
  #flush() {
    if (this.#starts.length === 0) return;
    throw this.#makeNotCompleteError();
  }
  #enqueue(chunk: SAXEventInterface): string | undefined {
    switch (chunk.name) {
      case "cdata":
        return this.#cdata(chunk);
      case "comment":
        return this.#comment(chunk);
      case "processingInstruction":
        return this.#processingInstruction(chunk);
      case "doctype":
        return this.#doctype(chunk);
      case "text":
        return this.#text(chunk);
      case "startElement":
        return this.#startElement(chunk);
      case "endElement":
        return this.#endElement(chunk);
      case "startDocument":
        return this.#startDocument(chunk);
      case "endDocument":
        return this.#endDocument(chunk);
    }
  }
  #cdata(chunk: CdataSAXEventInterface) {
    return `${this.#prefix}${CDATA_PREFIX}${chunk.cdata}${CDATA_SUFFIX}${this.#suffix}`;
  }
  #comment(chunk: CommentSAXEventInterface) {
    return `${this.#prefix}${COMMENT_PREFIX}${chunk.comment}${COMMENT_SUFFIX}${this.#suffix}`;
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
  #processingInstruction(chunk: ProcessingInstructionSAXEventInterface) {
    const joins: string[] = [];
    joins.push(`${PROCESSING_INSTRUCTION_PREFIX}${chunk.target}`);
    joins.push(`${chunk.data}`);
    joins.push(PROCESSING_INSTRUCTION_SUFFIX);
    return `${this.#prefix}${joins.join(" ")}${this.#suffix}`;
  }
  #startElement(chunk: StartElementSAXEventInterface) {
    const joins: string[] = [];
    joins.push(`${BLOCK_PREFIX}${chunk.tagName}`);
    if (chunk.attrs)
      for (const [key, value] of Object.entries(chunk.attrs))
        joins.push(`${key}="${escape(value)}"`);
    const indent = this.#prefix;
    this.#starts.push(chunk);
    if (chunk.selfClosing) {
      return `${this.#prefix}${joins.join(" ")}/${BLOCK_SUFFIX}`;
    }
    this.#prefix = this.#makeIndent();
    return `${indent}${joins.join(" ")}${BLOCK_SUFFIX}${this.#suffix}`;
  }
  #endElement(chunk: EndElementSAXEventInterface) {
    const endTagName = chunk.tagName;
    const start = this.#starts.pop();
    this.#prefix = this.#makeIndent();
    if (!start || start.name === "startDocument") {
      const error = this.#makeError(`mismatch startElement not found. endTagName: ${endTagName}`);
      Object.assign(error as unknown as Record<string, unknown>, {
        endTagName,
        chunk,
      });
      throw error;
    }
    const startTagName = start.tagName;
    if (startTagName !== endTagName) {
      const error = this.#makeError(`mismatch startElement tagName ${startTagName} / endTagName ${endTagName}`);
      Object.assign(error as unknown as Record<string, unknown>, {
        startTagName,
        endTagName,
        chunk,
        start,
      });
      throw error;
    }
    if (start.selfClosing) return undefined;
    return `${this.#prefix}${BLOCK_PREFIX}/${chunk.tagName}${BLOCK_SUFFIX}${this.#suffix}`;
  }
  #startDocument(chunk: StartDocumentSAXEventInterface) {
    this.#starts.push(chunk);
    return undefined;
  }
  #endDocument(chunk: EndDocumentSAXEventInterface) {
    const start = this.#starts.pop();
    if (!start || start.name === "startElement") {
      const error = this.#makeError(`mismatch startDocument not found.`);
      Object.assign(error as unknown as Record<string, unknown>, {
        chunk,
      });
      throw error;
    }
    return undefined;
  }
}

