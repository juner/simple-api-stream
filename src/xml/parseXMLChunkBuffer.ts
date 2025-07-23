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
const DOCTYPE_D_SUFFIX = "]>"
const BLOCK_SUFFIX = ">";
const DECLARATION_PREFIX = "<?";
const XML_STYLESHEET_DECLARATION_PREFIX = "<?xml-stylesheet";
const XML_DECLARATION_PREFIX = "<?xml"
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

    while (cursor < buffer.length) {
      switch (state) {
        case ParseState.Text: {
          const nextOpen = buffer.indexOf(BLOCK_PREFIX, cursor);
          if (nextOpen === -1) {
            acc += buffer.slice(cursor);
            cursor = buffer.length;
            break;
          }

          acc += buffer.slice(cursor, nextOpen);
          if (acc) {
            handler.onText?.(new TextEvent(acc));
            acc = "";
          }

          cursor = nextOpen;

          const remaining = buffer.slice(cursor);

          if (remaining.startsWith(COMMENT_PREFIX)) {
            state = ParseState.Comment;
            cursor += COMMENT_PREFIX.length;
          } else if (remaining.startsWith(CDATA_PREFIX)) {
            state = ParseState.Cdata;
            cursor += CDATA_PREFIX.length;
          } else if (remaining.startsWith(DOCTYPE_PREFIX)) {
            state = ParseState.Doctype;
            acc = "";
            cursor += DOCTYPE_PREFIX.length;
          } else if (remaining.startsWith(XML_STYLESHEET_DECLARATION_PREFIX)) {
            state = ParseState.DisplayingXML;
            acc = "";
            cursor += XML_STYLESHEET_DECLARATION_PREFIX.length;
          } else if (remaining.startsWith(XML_DECLARATION_PREFIX)) {
            state = ParseState.XMLDeclaration;
            acc = "";
            cursor += XML_DECLARATION_PREFIX.length;
          } else if (
            CDATA_PREFIX.startsWith(remaining) ||
            DOCTYPE_PREFIX.startsWith(remaining) ||
            COMMENT_PREFIX.startsWith(remaining) ||
            XML_STYLESHEET_DECLARATION_PREFIX.startsWith(remaining) ||
            XML_DECLARATION_PREFIX.startsWith(remaining)
          ) {
            return buffer.slice(cursor); // 不完全なトークン、次チャンク待ち
          } else if (remaining.startsWith(DECLARATION_PREFIX)) {
            const end = buffer.indexOf(DECLARATION_SUFFIX, cursor);
            if (end === -1) return buffer.slice(cursor); // incomplete PI
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
          if (end === -1) return COMMENT_PREFIX + buffer.slice(cursor);
          const content = buffer.slice(cursor, end);
          handler.onComment?.(new CommentEvent(content));
          cursor = end + COMMENT_SUFFIX.length;
          state = ParseState.Text;
          break;
        }

        case ParseState.Cdata: {
          const end = buffer.indexOf(CDATA_SUFFIX, cursor);
          if (end === -1) return CDATA_PREFIX + buffer.slice(cursor);
          const content = buffer.slice(cursor, end);
          handler.onCdata?.(new CdataEvent(content));
          cursor = end + CDATA_SUFFIX.length;
          state = ParseState.Text;
          break;
        }

        case ParseState.Doctype: {
          const endBracket = buffer.indexOf(DOCTYPE_D_SUFFIX, cursor);

          if (endBracket !== -1) {
            // 内部サブセットを含む DOCTYPE 宣言が閉じた
            const content = buffer.slice(cursor, endBracket + 1); // +1 to include ']'
            handler.onDtd?.(new DtdEvent(DOCTYPE_PREFIX + content + BLOCK_SUFFIX));
            cursor = endBracket + DOCTYPE_D_SUFFIX.length;
            acc = "";
            state = ParseState.Text;
            continue;
          }
          // `]>` が見つかるまでは、途中の `>` を無視（不完全チャンクとして待つ）
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
    // ここでは処理しない（Doctype や PI は別の状態で処理される）
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
