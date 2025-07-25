import {
  CdataEvent,
  CommentEvent,
  EndElementEvent,
  StartElementEvent,
  TextEvent,
  XMLDeclarationEvent,
  DisplayingXMLEvent,
  DoctypeSimpleEvent,
  DoctypePublicEvent,
  DoctypeSystemEvent,
} from "./event";
import { SimpleSAXHandler } from "./interface";
import { unescape } from "./utils";

const CDATA_PREFIX = "<![CDATA[";
const CDATA_SUFFIX = "]]>";
const BLOCK_PREFIX = "<";
const DOCTYPE_PREFIX = "<!DOCTYPE";
const DOCTYPE_BLOCK_START = "[";
const DOCTYPE_BLOCK_SUFFIX = "]>";
const BLOCK_SUFFIX = ">";
const DECLARATION_PREFIX = "<?";
const XML_STYLESHEET_DECLARATION_PREFIX = "<?xml-stylesheet ";
const XML_DECLARATION_PREFIX = "<?xml ";
const DECLARATION_SUFFIX = "?>";
const COMMENT_PREFIX = "<!--";
const COMMENT_SUFFIX = "-->";

export class XMLTextToSAXParser extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
    this.name = "SimpleSAXParseXMLBufferError";
  }
}

export class SimpleSAXParseXMLBuffer {
  #buffer: string = "";
  #handler: Partial<SimpleSAXHandler>;
  #acc: string = "";
  #cursor: number = 0;
  #factor!: (flush: boolean) => { required?: true };

  get buffer() {
    return this.#buffer;
  }

  get state() {
    return this.#factor.name.slice(1);
  }

  get acc() {
    return this.#acc;
  }

  #status() {
    return {
      buffer: this.#buffer,
      state: this.state,
      acc: this.#acc,
    };
  }

  constructor({ handler }: { handler: Partial<SimpleSAXHandler> }) {
    this.#handler = handler;
    this.#factor = this.#text;
  }

  enqueue(chunk: string) {
    this.#buffer += chunk;
    this.#parseBuffer();
  }

  flush() {
    this.#parseBuffer(true);
  }

  error(reasone: unknown) {
    this.#handler?.onError?.(reasone);
  }

  /**
   * make error new SimpleSAXParseXMLBufferError
   * @param message error message
   * @param options error option
   * @returns
   */
  #makeError(message: string, options?: ConstructorParameters<typeof Error>[1]) {
    const cause = {
      instance: this,
      status: this.#status(),
      ...(options?.cause ?? {})
    };
    (options ??= {}).cause = cause;
    return new XMLTextToSAXParser(message, options);
  }

  /**
   * make not complete error
   * @returns
   */
  #makeNotCompleteError() {
    return this.#makeError(`not complete syntax error. buffer:${this.#buffer}`);
  }

  /**
   * make syntax error
   * @param message
   * @param source
   * @returns
   */
  #makeSyntaxError(message: string, source: string) {
    return this.#makeError(`${message}: ${source}`, {
      cause: {
        syntax: source,
      }
    });
  }
  #parseBuffer(flush: boolean = false): void {
    try {
      this.#cursor = 0;
      while (this.#cursor < this.#buffer.length) {
        const { required } = this.#factor(flush);
        if (required)
          if (flush) throw this.#makeNotCompleteError();
          else return;
      }
      if (flush && this.#acc.length > 0) {
        const text = this.#acc;
        this.#handler.onText?.(new TextEvent(text));
        this.#acc = "";
      }
      this.#buffer = "";
      return;
    } catch (err: unknown) {
      this.#handler.onError?.(err instanceof Error
        ? err
        : this.#makeError(String(err),
          {
            cause: {
              origin: err,
            }
          }));
      return;
    }
  }
  // #region factors
  #text(): { required?: true } {
    const nextOpen = this.#buffer.indexOf(BLOCK_PREFIX, this.#cursor);
    if (nextOpen === -1) {
      this.#acc += this.#buffer.slice(this.#cursor);
      this.#cursor = this.#buffer.length;
      return {};
    }

    this.#acc += this.#buffer.slice(this.#cursor, nextOpen);
    if (this.#acc.trim() !== "") {
      this.#handler.onText?.(new TextEvent(unescape(this.#acc)));
    }

    this.#cursor = nextOpen;
    this.#acc = "";

    const remaining = this.#buffer.slice(this.#cursor);
    const remaingin_upper = remaining.toUpperCase();

    if (remaining.startsWith(COMMENT_PREFIX)) {
      this.#factor = this.#comment;
    } else if (remaining.startsWith(CDATA_PREFIX)) {
      this.#factor = this.#cdata;
    } else if (remaingin_upper.startsWith(DOCTYPE_PREFIX)) {
      this.#factor = this.#doctype;
    } else if (remaining.startsWith(XML_STYLESHEET_DECLARATION_PREFIX)) {
      this.#factor = this.#displayingXML;
    } else if (remaining.startsWith(XML_DECLARATION_PREFIX)) {
      this.#factor = this.#xmlDeclaration;
    } else if (
      CDATA_PREFIX.startsWith(remaining) ||
      DOCTYPE_PREFIX.startsWith(remaingin_upper) ||
      COMMENT_PREFIX.startsWith(remaining) ||
      XML_STYLESHEET_DECLARATION_PREFIX.startsWith(remaining) ||
      XML_DECLARATION_PREFIX.startsWith(remaining)
    ) {
      this.#buffer = this.#buffer.slice(this.#cursor); // 不完全トークン
      return { required: true };
    } else if (remaining.startsWith(DECLARATION_PREFIX)) {
      const end = this.#buffer.indexOf(DECLARATION_SUFFIX, this.#cursor);
      if (end === -1) {
        this.#buffer = this.#buffer.slice(this.#cursor);
        return { required: true };
      }
      this.#cursor = end + DECLARATION_SUFFIX.length;
    } else {
      this.#factor = this.#tag;
    }
    return {};
  }
  #comment(): { required?: true } {
    const end = this.#buffer.indexOf(COMMENT_SUFFIX, this.#cursor);
    if (end < 0) {
      this.#buffer = this.#buffer.slice(this.#cursor);
      return { required: true };
    }
    const content = this.#buffer.slice(this.#cursor + COMMENT_PREFIX.length, end);
    this.#handler.onComment?.(new CommentEvent(unescape(content)));
    this.#cursor = end + COMMENT_SUFFIX.length;
    this.#factor = this.#text;
    return {};
  }
  #cdata(): { required?: true } {
    const end = this.#buffer.indexOf(CDATA_SUFFIX, this.#cursor);
    if (end < 0) {
      this.#buffer = this.#buffer.slice(this.#cursor);
      return { required: true };
    }
    const content = this.#buffer.slice(this.#cursor + CDATA_PREFIX.length, end);
    this.#handler.onCdata?.(new CdataEvent(content));
    this.#cursor = end + CDATA_SUFFIX.length;
    this.#factor = this.#text;
    return {};
  }
  #doctype(): { required?: true } {
    const endBracket = this.#buffer.indexOf(DOCTYPE_BLOCK_SUFFIX, this.#cursor);
    const blockStart = this.#buffer.indexOf(DOCTYPE_BLOCK_START, this.#cursor);
    const endBlock = this.#buffer.indexOf(BLOCK_SUFFIX, this.#cursor);

    const mode = endBlock < 0 ? undefined : 0 <= blockStart && blockStart < endBlock ? "block" : "simple";

    if (mode === "simple" && 0 <= endBlock) {
      const next = endBlock + BLOCK_SUFFIX.length;
      const content = this.#buffer.slice(this.#cursor, next);
      this.#handler.onDoctype?.(this.#parseDoctype(content));
      this.#cursor = next;
      this.#acc = "";
      this.#factor = this.#text;
      return {};
    }
    if (mode === "block" && 0 <= endBracket) {
      const next = endBracket + DOCTYPE_BLOCK_SUFFIX.length;
      const content = this.#buffer.slice(this.#cursor, next);
      this.#handler.onDoctype?.(this.#parseDoctype(content));
      this.#cursor = next;
      this.#acc = "";
      this.#factor = this.#text;
      return {};
    }
    this.#buffer = this.#buffer.slice(this.#cursor);
    return { required: true };
  }
  #displayingXML(): { required?: true } {
    const end = this.#buffer.indexOf(DECLARATION_SUFFIX, this.#cursor);
    if (end === -1) {
      this.#buffer = this.#buffer.slice(this.#cursor);
      return { required: true };
    }
    const acc = this.#buffer.slice(this.#cursor, end);
    const attrs = this.#parseAttributes(acc);
    if (attrs.type && attrs.href) {
      this.#handler.onDisplayingXML?.(
        new DisplayingXMLEvent(attrs.type, attrs.href)
      );
    } else {
      throw this.#makeError(`Invalid xml-stylesheet declaration: ${this.#acc}`, {
        cause: {
          syntax: this.#acc,
        }
      });
    }
    this.#cursor = end + DECLARATION_SUFFIX.length;
    this.#factor = this.#text;
    return {};
  }
  #xmlDeclaration(): { required?: true } {
    const end = this.#buffer.indexOf(DECLARATION_SUFFIX, this.#cursor);
    if (end === -1) {
      this.#buffer = this.#buffer.slice(this.#cursor);
      return { required: true };
    }
    const acc = this.#buffer.slice(this.#cursor, end);
    const attrs = this.#parseAttributes(acc);
    this.#handler.onXmlDeclaration?.(
      new XMLDeclarationEvent(
        attrs.version ?? "1.0",
        attrs.encoding ?? "UTF-8",
        attrs.standalone === "no" ? "no" : "yes"
      )
    );
    this.#cursor = end + DECLARATION_SUFFIX.length;
    this.#factor = this.#text;
    return {};
  }
  #tag(): { required?: true } {
    const end = this.#buffer.indexOf(BLOCK_SUFFIX, this.#cursor);
    if (end === -1) {
      this.#buffer = this.#buffer.slice(this.#cursor);
      return { required: true };
    }
    const acc = this.#buffer.slice(this.#cursor, end + BLOCK_SUFFIX.length);
    {
      const { start, end } = this.#parseTag(acc);
      if (start) this.#handler.onStartElement?.(start);
      if (end) this.#handler.onEndElement?.(end);
    }
    this.#cursor = end + BLOCK_SUFFIX.length;
    this.#factor = this.#text;
    this.#acc = "";
    return {};
  }
  // #endregion

  #parseAttributes(source: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrRegex = /\s*([a-zA-Z0-9_:.-]+)=(?:"([^"]*)"|'([^']*)')/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(source))) {
      const [, key, val1, val2] = match;
      attrs[key] = val1 ?? val2 ?? "";
    }
    return attrs;
  }

  #parseDoctype(source: string) {
    const matches = /^<![Dd][Oo][Cc][Tt][Yy][Pp][Ee]\s+(?<root>[^\s]+)(?:\s+(?<dtdType>[Pp][Uu][Bb][Ll][Ii][Cc]|[Ss][Yy][Ss][Tt][Ee][Mm]))?(?:\s+"(?<uri1>[^"]+)")?(?:\s+"(?<uri2>[^"]+)")?(?:\s+\[(?<declarations>[\S\s]+)\])?>$/m.exec(source);
    if (!matches)
      throw this.#makeSyntaxError("Invalid doctype syntax", source);
    const { root, dtdType: dtdType_, uri1, uri2, declarations: declarations_ } = matches.groups ?? {};
    const dtdType = dtdType_?.toUpperCase();
    const declarations = ((declarations) => {
      if ((declarations?.length ?? 0) === 0) return undefined;
      return Array.from(next(/<![^>]+>/gmu, declarations), r => r[0]);
    })(declarations_);
    if (!root)
      throw this.#makeSyntaxError("doctype", source);
    if (dtdType === "PUBLIC")
      return new DoctypePublicEvent(root, {
        dtdType,
        identifer: uri1,
        uri: uri2,
        declarations,
      });
    if (dtdType === "SYSTEM")
      return new DoctypeSystemEvent(root, {
        dtdType,
        uri: uri1 ?? uri2,
        declarations,
      });
    return new DoctypeSimpleEvent(root, {
      declarations,
    });
  }

  #parseTag(source: string): { start?: StartElementEvent, end?: EndElementEvent } {
    if (source.startsWith("<!") || source.startsWith("<?")) {
      return {};
    }
    const tagMatch = /^<\/?([a-zA-Z0-9_:.-]+)([^>]*)\/?>$/.exec(source.trim());
    if (!tagMatch)
      throw this.#makeSyntaxError("tag", source);

    const [, tagName, attrStrRaw] = tagMatch;
    const isClosing = source.startsWith("</");
    const isSelfClosing =
      source.endsWith("/>") || attrStrRaw.trimEnd().endsWith("/");

    if (isClosing) {
      const end = new EndElementEvent(tagName);
      return { end };
    }

    const attrStr = attrStrRaw.trim().replace(/\/$/, "").trim();
    const attrs: Record<string, string> = {};
    let match: RegExpExecArray | null;
    const attrRegex = /\s*([a-zA-Z0-9_:.-]+)=(?:"([^"]*)"|'([^']*)')/g;
    let prevIndex = 0;

    while ((match = attrRegex.exec(attrStr))) {
      const [, key, val1, val2] = match;
      attrs[key] = unescape(val1 ?? val2 ?? "");
      prevIndex = attrRegex.lastIndex;
    }

    const remaining = attrStr.slice(prevIndex).trim();
    if (remaining.length > 0) {
      throw this.#makeError(`Invalid or unquoted attribute syntax near: ${remaining}`,
        {
          cause: {
            syntax: remaining,
          }
        });
    }

    const start = new StartElementEvent(tagName, attrs, isSelfClosing);
    if (isSelfClosing) {
      const end = new EndElementEvent(tagName);
      return { start, end };
    }
    return { start };
  }
}

/** iterate Regexp.exec */
function* next(regexp: RegExp, source: string) {
  console.assert(regexp.global);
  let result: RegExpExecArray | null = null;
  while ((result = regexp.exec(source)) !== null) {
    yield result;
  };
}
