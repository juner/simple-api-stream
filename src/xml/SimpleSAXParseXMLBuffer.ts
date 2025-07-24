import {
  CdataEvent,
  CommentEvent,
  DoctypeEvent,
  EndElementEvent,
  StartElementEvent,
  TextEvent,
  XMLDeclarationEvent,
  DisplayingXMLEvent,
} from "./event";
import { SimpleSAXHandler } from "./interface";

const parseState = Object.freeze({
  Text: "Text",
  Comment: "Comment",
  Cdata: "Cdata",
  Doctype: "Doctype",
  Tag: "Tag",
  XMLDeclaration: "XMLDeclaration",
  DisplayingXML: "DisplayingXML",
});
type ParseState = typeof parseState[keyof typeof parseState];

const CDATA_PREFIX = "<![CDATA[";
const CDATA_SUFFIX = "]]>";
const BLOCK_PREFIX = "<";
const DOCTYPE_PREFIX = "<!DOCTYPE";
const DOCTYPE_BLOCK_START = "[";
const DOCTYPE_BLOCK_SUFFIX = "]>";
const BLOCK_SUFFIX = ">";
const DECLARATION_PREFIX = "<?";
const XML_STYLESHEET_DECLARATION_PREFIX = "<?xml-stylesheet";
const XML_DECLARATION_PREFIX = "<?xml";
const DECLARATION_SUFFIX = "?>";
const COMMENT_PREFIX = "<!--";
const COMMENT_SUFFIX = "-->";

export class SimpleSAXParseXMLBuffer {
  #buffer: string = "";
  #state: ParseState = parseState.Text;
  #handler: Partial<SimpleSAXHandler>;
  #acc: string = "";
  get buffer() {
    return this.#buffer;
  }
  get state() {
    return this.#state;
  }
  get acc() {
    return this.#acc;
  }
  #status() {
    return {
      buffer: this.#buffer,
      state: this.#state,
      acc: this.#acc,
    };
  }
  constructor({ handler }: { handler: Partial<SimpleSAXHandler> }) {
    this.#handler = handler;
  }
  enqueue(chunk: string) {
    this.#buffer += chunk;
    this.#parseXMLChunkBuffer(this.#handler);
  }
  flush() {
    this.#parseXMLChunkBuffer(this.#handler);
  }
  error(reasone: unknown) {
    this.#handler?.onError?.(reasone);
  }
  #parseXMLChunkBuffer(
    handler: Partial<SimpleSAXHandler>
  ): void {
    try {
      let cursor = 0;
      while (cursor < this.#buffer.length) {
        console.dir({ acc: this.#acc, state: this.#state, cursor, buffer: this.#buffer });
        switch (this.#state) {
          case parseState.Text: {
            const nextOpen = this.#buffer.indexOf(BLOCK_PREFIX, cursor);
            if (nextOpen === -1) {
              this.#acc += this.#buffer.slice(cursor);
              cursor = this.#buffer.length;
              break;
            }

            this.#acc += this.#buffer.slice(cursor, nextOpen);
            if (this.#acc.trim() !== "") {
              handler.onText?.(new TextEvent(this.#acc));
            }

            cursor = nextOpen;
            console.dir({ acc: this.#acc });
            this.#acc = "";

            const remaining = this.#buffer.slice(cursor);

            if (remaining.startsWith(COMMENT_PREFIX)) {
              this.#state = parseState.Comment;
            } else if (remaining.startsWith(CDATA_PREFIX)) {
              this.#state = parseState.Cdata;
            } else if (remaining.startsWith(DOCTYPE_PREFIX)) {
              this.#state = parseState.Doctype;
            } else if (remaining.startsWith(XML_STYLESHEET_DECLARATION_PREFIX)) {
              this.#state = parseState.DisplayingXML;
            } else if (remaining.startsWith(XML_DECLARATION_PREFIX)) {
              this.#state = parseState.XMLDeclaration;
            } else if (
              CDATA_PREFIX.startsWith(remaining) ||
              DOCTYPE_PREFIX.startsWith(remaining) ||
              COMMENT_PREFIX.startsWith(remaining) ||
              XML_STYLESHEET_DECLARATION_PREFIX.startsWith(remaining) ||
              XML_DECLARATION_PREFIX.startsWith(remaining)
            ) {
              this.#buffer = this.#buffer.slice(cursor); // 不完全トークン
              return;
            } else if (remaining.startsWith(DECLARATION_PREFIX)) {
              const end = this.#buffer.indexOf(DECLARATION_SUFFIX, cursor);
              if (end === -1) {
                this.#buffer = this.#buffer.slice(cursor);
                return;
              }
              cursor = end + DECLARATION_SUFFIX.length;
              continue;
            } else {
              this.#state = parseState.Tag;
            }
            break;
          }

          case parseState.Comment: {
            const end = this.#buffer.indexOf(COMMENT_SUFFIX, cursor);
            if (end < 0) {
              this.#buffer = this.#buffer.slice(cursor);
              return;
            }
            const content = this.#buffer.slice(cursor, end);
            handler.onComment?.(new CommentEvent(content));
            cursor = end + COMMENT_SUFFIX.length;
            this.#state = parseState.Text;
            break;
          }

          case parseState.Cdata: {
            const end = this.#buffer.indexOf(CDATA_SUFFIX, cursor);
            if (end < 0) {
              this.#buffer = this.#buffer.slice(cursor);
              return;
            }
            const content = this.#buffer.slice(cursor, end);
            handler.onCdata?.(new CdataEvent(content));
            cursor = end + CDATA_SUFFIX.length;
            this.#state = parseState.Text;
            break;
          }

          case parseState.Doctype: {
            const endBracket = this.#buffer.indexOf(DOCTYPE_BLOCK_SUFFIX, cursor);
            const blockStart = this.#buffer.indexOf(DOCTYPE_BLOCK_START, cursor);
            const endBlock = this.#buffer.indexOf(BLOCK_SUFFIX, cursor);

            const mode = endBlock < 0 ? undefined : 0 <= blockStart && blockStart < endBlock ? "block" : "simple";

            if (mode === "simple" && 0 <= endBlock) {
              const next = endBlock + BLOCK_SUFFIX.length;
              const content = this.#buffer.slice(cursor, next);
              const dtd = content;
              handler.onDoctype?.(new DoctypeEvent(dtd));
              cursor = next;
              console.dir({ acc: this.#acc });
              this.#acc = "";
              this.#state = parseState.Text;
              continue;
            }
            if (mode === "block" && 0 <= endBracket) {
              const next = endBracket + DOCTYPE_BLOCK_SUFFIX.length;
              const content = this.#buffer.slice(cursor, next);
              const dtd = content;
              handler.onDoctype?.(new DoctypeEvent(dtd));
              cursor = next;
              console.dir({ acc: this.#acc });
              this.#acc = "";
              this.#state = parseState.Text;
              continue;
            }
            this.#buffer = this.#buffer.slice(cursor);
            return;
          }

          case parseState.DisplayingXML: {
            const end = this.#buffer.indexOf(DECLARATION_SUFFIX, cursor);
            if (end === -1) {
              this.#buffer = this.#buffer.slice(cursor);
              return;
            }
            this.#acc += this.#buffer.slice(cursor, end);
            const attrs = this.parseAttributes(this.#acc);
            if (attrs.type && attrs.href) {
              handler.onDisplayingXML?.(
                new DisplayingXMLEvent(attrs.type, attrs.href)
              );
            } else {
              handler.onError?.(
                new Error(`Invalid xml-stylesheet declaration: ${this.#acc}`,
                  {
                    cause: {
                      status: this.#status(),
                      instance: this,
                    }
                  })
              );
            }
            cursor = end + DECLARATION_SUFFIX.length;
            this.#state = parseState.Text;
            break;
          }

          case parseState.XMLDeclaration: {
            const end = this.#buffer.indexOf(DECLARATION_SUFFIX, cursor);
            if (end === -1) {
              this.#buffer = this.#buffer.slice(cursor);
              return;
            }
            this.#acc += this.#buffer.slice(cursor, end);
            const attrs = this.parseAttributes(this.#acc);
            handler.onXmlDeclaration?.(
              new XMLDeclarationEvent(
                attrs.version ?? "1.0",
                attrs.encoding ?? "UTF-8",
                attrs.standalone === "no" ? "no" : "yes"
              )
            );
            cursor = end + DECLARATION_SUFFIX.length;
            this.#state = parseState.Text;
            break;
          }

          case parseState.Tag: {
            const end = this.#buffer.indexOf(BLOCK_SUFFIX, cursor);
            if (end === -1) {
              this.#acc += this.#buffer.slice(cursor);
              this.#buffer = this.#acc;
              return;
            }
            this.#acc += this.#buffer.slice(cursor, end + 1);
            this.processTag(this.#acc, handler);
            cursor = end + BLOCK_SUFFIX.length;
            this.#state = parseState.Text;
            console.dir({ acc: this.#acc });
            this.#acc = "";
            break;
          }

          default:
            throw new Error("Unknown parse state",
              {
                cause: {
                  status: this.#status(),
                  instance: this,
                }
              });
        }
      }
      this.#buffer = "";
      return;
    } catch (err: unknown) {
      handler.onError?.(err instanceof Error
        ? err
        : new Error(String(err),
          {
            cause: {
              status: this.#status(),
              instance: this,
            }
          }));
      return;
    }
  }
  parseAttributes(source: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrRegex = /\s*([a-zA-Z0-9_:.-]+)=(?:"([^"]*)"|'([^']*)')/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(source))) {
      const [, key, val1, val2] = match;
      attrs[key] = val1 ?? val2 ?? "";
    }
    return attrs;
  }

  processTag(source: string, handler: Partial<SimpleSAXHandler>) {
    if (source.startsWith("<!") || source.startsWith("<?")) {
      return;
    }
    const tagMatch = /^<\/?([a-zA-Z0-9_:.-]+)([^>]*)\/?>$/.exec(source.trim());
    if (!tagMatch) {
      handler.onError?.(new Error(`Invalid tag syntax: ${source}`,
        {
          cause: {
            status: this.#status(),
            instance: this,
          }
        }));
      return;
    }

    const [, tagName, attrStrRaw] = tagMatch;
    const isClosing = source.startsWith("</");
    const isSelfClosing =
      source.endsWith("/>") || attrStrRaw.trimEnd().endsWith("/");

    if (isClosing) {
      handler.onEndElement?.(new EndElementEvent(tagName));
      return;
    }

    const attrStr = attrStrRaw.trim().replace(/\/$/, "").trim();
    const attrs: Record<string, string> = {};
    let match: RegExpExecArray | null;
    const attrRegex = /\s*([a-zA-Z0-9_:.-]+)=(?:"([^"]*)"|'([^']*)')/g;
    let prevIndex = 0;

    while ((match = attrRegex.exec(attrStr))) {
      const [, key, val1, val2] = match;
      attrs[key] = val1 ?? val2 ?? "";
      prevIndex = attrRegex.lastIndex;
    }

    const remaining = attrStr.slice(prevIndex).trim();
    if (remaining.length > 0) {
      handler.onError?.(
        new Error(`Invalid or unquoted attribute syntax near: ${remaining}`,
          {
            cause: {
              status: this.#status(),
              instance: this,
            }
          })
      );
    }

    handler.onStartElement?.(
      new StartElementEvent(tagName, attrs, isSelfClosing)
    );
    if (isSelfClosing) {
      handler.onEndElement?.(new EndElementEvent(tagName));
    }
  }
}


