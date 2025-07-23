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
  handler: Partial<SimpleSAXHandler>
): string {
  try {
    let state = ParseState.Text;
    let cursor = 0;
    let acc = "";

    while (cursor < buffer.length) {
      switch (state) {
        case ParseState.Text: {
          const nextOpen = buffer.indexOf("<", cursor);
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

          if (remaining.startsWith("<!--")) {
            state = ParseState.Comment;
            cursor += 4;
          } else if (remaining.startsWith("<![CDATA[")) {
            state = ParseState.Cdata;
            cursor += 9;
          } else if (remaining.startsWith("<!DOCTYPE")) {
            state = ParseState.Doctype;
            acc = "";
            cursor += 9;
          } else if (remaining.startsWith("<?xml-stylesheet")) {
            state = ParseState.DisplayingXML;
            acc = "";
            cursor += 18;
          } else if (remaining.startsWith("<?xml")) {
            state = ParseState.XMLDeclaration;
            acc = "";
            cursor += 5;
          } else if (
            "<![CDATA[".startsWith(remaining) ||
            "<!DOCTYPE".startsWith(remaining) ||
            "<!--".startsWith(remaining) ||
            "<?xml-stylesheet".startsWith(remaining) ||
            "<?xml".startsWith(remaining)
          ) {
            return buffer.slice(cursor); // 不完全なトークン、次チャンク待ち
          } else if (remaining.startsWith("<?")) {
            const end = buffer.indexOf("?>", cursor);
            if (end === -1) return buffer.slice(cursor); // incomplete PI
            cursor = end + 2;
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
          if (end === -1) return "<!--" + buffer.slice(cursor);
          const content = buffer.slice(cursor, end);
          handler.onComment?.(new CommentEvent(content));
          cursor = end + 3;
          state = ParseState.Text;
          break;
        }

        case ParseState.Cdata: {
          const end = buffer.indexOf("]]>", cursor);
          if (end === -1) return "<![CDATA[" + buffer.slice(cursor);
          const content = buffer.slice(cursor, end);
          handler.onCdata?.(new CdataEvent(content));
          cursor = end + 3;
          state = ParseState.Text;
          break;
        }

        case ParseState.Doctype: {
          const end = buffer.indexOf("]>", cursor);
          if (end === -1) return "<!DOCTYPE" + buffer.slice(cursor);
          const content = buffer.slice(cursor, end + 1); // `[`〜`]`
          handler.onDtd?.(new DtdEvent("<!DOCTYPE" + content + ">"));
          cursor = end + 2;
          state = ParseState.Text;
          break;
        }

        case ParseState.DisplayingXML: {
          const end = buffer.indexOf("?>", cursor);
          if (end === -1) return "<?xml-stylesheet" + buffer.slice(cursor);
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
          cursor = end + 2;
          state = ParseState.Text;
          break;
        }

        case ParseState.XMLDeclaration: {
          const end = buffer.indexOf("?>", cursor);
          if (end === -1) return "<?xml" + buffer.slice(cursor);
          acc += buffer.slice(cursor, end);
          const attrs = parseAttributes(acc);
          handler.onXmlDeclaration?.(
            new XMLDeclarationEvent(
              attrs.version ?? "1.0",
              attrs.encoding ?? "UTF-8",
              attrs.standalone === "no" ? "no" : "yes"
            )
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
