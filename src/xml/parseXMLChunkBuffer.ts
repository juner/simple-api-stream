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

export function parseXMLChunkBuffer(
  buffer: string,
  handler: Partial<SimpleSAXHandler>,
): string {
  try {
    let state = ParseState.Text;
    let cursor = 0;
    let acc = "";

    while (cursor < buffer.length) {
      switch (state) {
        case ParseState.Text: {
          const nextOpen = buffer.indexOf("<", cursor);
          const text =
            nextOpen === -1
              ? buffer.slice(cursor)
              : buffer.slice(cursor, nextOpen);
          if (text.trim()) handler.onText?.(new TextEvent(text));
          if (nextOpen === -1) return ""; // 完全に処理済み
          const remaining = buffer.slice(nextOpen);
          cursor = nextOpen;

          if (remaining.startsWith("<!--")) {
            state = ParseState.Comment;
            acc = "";
            cursor += 4;
          } else if (remaining.startsWith("<![CDATA[")) {
            state = ParseState.Cdata;
            acc = "";
            cursor += 9;
          } else if (remaining.startsWith("<!DOCTYPE")) {
            const end = buffer.indexOf(">", cursor);
            if (end === -1) return buffer.slice(cursor); // 続き待ち
            acc = buffer.slice(cursor, end + 1);
            handler.onDtd?.(new DtdEvent(acc));
            cursor = end + 1;
            continue;
          } else if (remaining.startsWith("<?xml-stylesheet")) {
            const offset = "<?xml-stylesheet".length;
            if (remaining.length < offset + 1) return buffer.slice(cursor);
            if (!/\s/.test(remaining[offset])) return buffer.slice(cursor);
            state = ParseState.DisplayingXML;
            acc = "";
            cursor += offset + 1;
          } else if (remaining.startsWith("<?xml")) {
            const offset = "<?xml".length;
            if (remaining.length < offset + 1) return buffer.slice(cursor);
            if (!/\s/.test(remaining[offset])) return buffer.slice(cursor);
            state = ParseState.XMLDeclaration;
            acc = "";
            cursor += offset + 1;
          } else if (
            "<![CDATA[".startsWith(remaining) ||
            "<!DOCTYPE".startsWith(remaining) ||
            "<!--".startsWith(remaining) ||
            "<?xml-stylesheet".startsWith(remaining) ||
            "<?xml".startsWith(remaining)
          ) {
            return buffer.slice(cursor); // 未完 → 次のチャンク待ち
          } else if (remaining.startsWith("<?")) {
            const end = buffer.indexOf("?>", cursor);
            if (end === -1) return buffer.slice(cursor);
            cursor = end + 2; // 未サポート PI はスキップ
            continue;
          } else {
            state = ParseState.Tag;
            acc = "<";
            cursor++;
          }
          break;
        }

        case ParseState.Comment: {
          const end = buffer.indexOf("-->", cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return "<!--" + acc;
          }
          acc += buffer.slice(cursor, end);
          handler.onComment?.(new CommentEvent(acc));
          cursor = end + 3;
          state = ParseState.Text;
          break;
        }

        case ParseState.Cdata: {
          const end = buffer.indexOf("]]>", cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return "<![CDATA[" + acc;
          }
          acc += buffer.slice(cursor, end);
          handler.onCdata?.(new CdataEvent(acc));
          cursor = end + 3;
          state = ParseState.Text;
          break;
        }

        case ParseState.DisplayingXML: {
          const end = buffer.indexOf("?>", cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return "<?xml-stylesheet " + acc;
          }
          acc += buffer.slice(cursor, end);
          const attrs = parseAttributes(acc);
          if (attrs.type && attrs.href) {
            handler.onDisplayingXML?.(
              new DisplayingXMLEvent(attrs.type, attrs.href),
            );
          } else {
            handler.onError?.(
              new Error(`Invalid xml-stylesheet declaration: ${acc}`),
            );
          }
          cursor = end + 2;
          state = ParseState.Text;
          break;
        }

        case ParseState.XMLDeclaration: {
          const end = buffer.indexOf("?>", cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return "<?xml " + acc;
          }
          acc += buffer.slice(cursor, end);
          const attrs = parseAttributes(acc);
          handler.onXmlDeclaration?.(
            new XMLDeclarationEvent(
              attrs.version ?? "1.0",
              attrs.encoding ?? "UTF-8",
              attrs.standalone === "no" ? "no" : "yes",
            ),
          );
          cursor = end + 2;
          state = ParseState.Text;
          break;
        }

        case ParseState.Tag: {
          const end = buffer.indexOf(">", cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return acc;
          }
          acc += buffer.slice(cursor, end + 1);
          processTag(acc, handler);
          cursor = end + 1;
          state = ParseState.Text;
          break;
        }

        default:
          throw new Error("Unknown parser state");
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
      new Error(`Invalid or unquoted attribute syntax near: ${remaining}`),
    );
  }

  handler.onStartElement?.(
    new StartElementEvent(tagName, attrs, isSelfClosing),
  );
  if (isSelfClosing) {
    handler.onEndElement?.(new EndElementEvent(tagName));
  }
}
