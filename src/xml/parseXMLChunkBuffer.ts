import {
  CdataEvent,
  CommentEvent,
  DtdEvent,
  EndElementEvent,
  StartElementEvent,
  TextEvent,
  XMLDeclarationEvent,
  DisplayingXMLEvent,
} from "./event";
import { SimpleSAXHandler } from "./interface";

const ParseState = {
  Text: Symbol("Text"),
  Comment: Symbol("Comment"),
  Cdata: Symbol("Cdata"),
  Doctype: Symbol("Doctype"),
  Tag: Symbol("Tag"),
  XMLDeclaration: Symbol("XMLDeclaration"),
  DisplayingXML: Symbol("DisplayingXML"),
} as const;

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

export function parseXMLChunkBuffer(
  buffer: string,
  handler: Partial<SimpleSAXHandler>
): string {
  try {
    let state = ParseState.Text;
    let cursor = 0;
    let acc = "";
    let lastCursor = -1;
    while (cursor < buffer.length) {
      if (lastCursor === cursor) {
        console.warn("🚨 無限ループの可能性: cursor が進んでいません", cursor);
        break;
      }
      lastCursor = cursor;
      console.dir({ acc, state, cursor, buffer });
      switch (state) {
        case ParseState.Text: {
          const nextOpen = buffer.indexOf(BLOCK_PREFIX, cursor);
          if (nextOpen === -1) {
            acc += buffer.slice(cursor);
            cursor = buffer.length;
            break;
          }

          acc += buffer.slice(cursor, nextOpen);
          if (acc.trim() !== "") {
            handler.onText?.(new TextEvent(acc));
          }

          cursor = nextOpen;
          console.dir({ acc });
          acc = "";

          const remaining = buffer.slice(cursor);

          if (remaining.startsWith(COMMENT_PREFIX)) {
            state = ParseState.Comment;
            cursor += COMMENT_PREFIX.length;
          } else if (remaining.startsWith(CDATA_PREFIX)) {
            state = ParseState.Cdata;
            cursor += CDATA_PREFIX.length;
          } else if (remaining.startsWith(DOCTYPE_PREFIX)) {
            state = ParseState.Doctype;
            cursor += DOCTYPE_PREFIX.length;
          } else if (remaining.startsWith(XML_STYLESHEET_DECLARATION_PREFIX)) {
            state = ParseState.DisplayingXML;
            cursor += XML_STYLESHEET_DECLARATION_PREFIX.length;
          } else if (remaining.startsWith(XML_DECLARATION_PREFIX)) {
            state = ParseState.XMLDeclaration;
            cursor += XML_DECLARATION_PREFIX.length;
          } else if (
            CDATA_PREFIX.startsWith(remaining) ||
            DOCTYPE_PREFIX.startsWith(remaining) ||
            COMMENT_PREFIX.startsWith(remaining) ||
            XML_STYLESHEET_DECLARATION_PREFIX.startsWith(remaining) ||
            XML_DECLARATION_PREFIX.startsWith(remaining)
          ) {
            return buffer.slice(cursor); // 不完全トークン
          } else if (remaining.startsWith(DECLARATION_PREFIX)) {
            const end = buffer.indexOf(DECLARATION_SUFFIX, cursor);
            if (end === -1) return buffer.slice(cursor);
            cursor = end + DECLARATION_SUFFIX.length;
            continue;
          } else {
            state = ParseState.Tag;
            acc = BLOCK_PREFIX;
            cursor++;
          }
          break;
        }

        case ParseState.Comment: {
          const end = buffer.indexOf(COMMENT_SUFFIX, cursor);
          if (end < 0) return COMMENT_PREFIX + buffer.slice(cursor);
          const content = buffer.slice(cursor, end);
          handler.onComment?.(new CommentEvent(content));
          cursor = end + COMMENT_SUFFIX.length;
          state = ParseState.Text;
          break;
        }

        case ParseState.Cdata: {
          const end = buffer.indexOf(CDATA_SUFFIX, cursor);
          if (end < 0) return CDATA_PREFIX + buffer.slice(cursor);
          const content = buffer.slice(cursor, end);
          handler.onCdata?.(new CdataEvent(content));
          cursor = end + CDATA_SUFFIX.length;
          state = ParseState.Text;
          break;
        }

        case ParseState.Doctype: {
          const endBracket = buffer.indexOf(DOCTYPE_BLOCK_SUFFIX, cursor);
          const blockStart = buffer.indexOf(DOCTYPE_BLOCK_START, cursor);
          const endBlock = buffer.indexOf(BLOCK_SUFFIX, cursor);

          const mode = endBlock < 0 ? undefined : 0 <= blockStart && blockStart < endBlock ? "block" : "simple";

          if (mode === "simple" && 0 <= endBlock) {
            const next = endBlock + BLOCK_SUFFIX.length;
            const content = buffer.slice(cursor, next);
            const dtd = DOCTYPE_PREFIX + content;
            handler.onDtd?.(new DtdEvent(dtd));
            cursor = next;
            console.dir({ acc });
            acc = "";
            state = ParseState.Text;
            continue;
          }
          if (mode === "block" && 0 <= endBracket) {
            const next = endBracket + DOCTYPE_BLOCK_SUFFIX.length;
            const content = buffer.slice(cursor, next);
            const dtd = DOCTYPE_PREFIX + content;
            handler.onDtd?.(new DtdEvent(dtd));
            cursor = next;
            console.dir({ acc });
            acc = "";
            state = ParseState.Text;
            continue;
          }
          return DOCTYPE_PREFIX + buffer.slice(cursor);
        }

        case ParseState.DisplayingXML: {
          const end = buffer.indexOf(DECLARATION_SUFFIX, cursor);
          if (end === -1) return XML_STYLESHEET_DECLARATION_PREFIX + buffer.slice(cursor);
          acc += buffer.slice(cursor, end);
          const attrs = parseAttributes(acc);
          if (attrs.type && attrs.href) {
            handler.onDisplayingXML?.(
              new DisplayingXMLEvent(attrs.type, attrs.href)
            );
          } else {
            handler.onError?.(
              new Error(`Invalid xml-stylesheet declaration: ${acc}`)
            );
          }
          cursor = end + DECLARATION_SUFFIX.length;
          state = ParseState.Text;
          break;
        }

        case ParseState.XMLDeclaration: {
          const end = buffer.indexOf(DECLARATION_SUFFIX, cursor);
          if (end === -1) return XML_DECLARATION_PREFIX + buffer.slice(cursor);
          acc += buffer.slice(cursor, end);
          const attrs = parseAttributes(acc);
          handler.onXmlDeclaration?.(
            new XMLDeclarationEvent(
              attrs.version ?? "1.0",
              attrs.encoding ?? "UTF-8",
              attrs.standalone === "no" ? "no" : "yes"
            )
          );
          cursor = end + DECLARATION_SUFFIX.length;
          state = ParseState.Text;
          break;
        }

        case ParseState.Tag: {
          const end = buffer.indexOf(BLOCK_SUFFIX, cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return acc;
          }
          acc += buffer.slice(cursor, end + 1);
          processTag(acc, handler);
          cursor = end + BLOCK_SUFFIX.length;
          state = ParseState.Text;
          console.dir({ acc });
          acc = "";
          break;
        }

        default:
          throw new Error("Unknown parse state");
      }
    }

    return "";
  } catch (err: unknown) {
    handler.onError?.(err instanceof Error ? err : new Error(String(err)));
    return buffer;
  }
}

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /\s*([a-zA-Z0-9_:.-]+)=(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(source))) {
    const [, key, val1, val2] = match;
    attrs[key] = val1 ?? val2 ?? "";
  }
  return attrs;
}

function processTag(source: string, handler: Partial<SimpleSAXHandler>) {
  if (source.startsWith("<!") || source.startsWith("<?")) {
    return;
  }
  const tagMatch = /^<\/?([a-zA-Z0-9_:.-]+)([^>]*)\/?>$/.exec(source.trim());
  if (!tagMatch) {
    handler.onError?.(new Error(`Invalid tag syntax: ${source}`));
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
      new Error(`Invalid or unquoted attribute syntax near: ${remaining}`)
    );
  }

  handler.onStartElement?.(
    new StartElementEvent(tagName, attrs, isSelfClosing)
  );
  if (isSelfClosing) {
    handler.onEndElement?.(new EndElementEvent(tagName));
  }
}
