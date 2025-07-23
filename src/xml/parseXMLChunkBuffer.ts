import { CdataEvent, CommentEvent, DtdEvent, EndElementEvent, StartElementEvent, TextEvent } from "./event";
import { SimpleSAXHandler } from "./interface";

const ParseState = {
  Text: 'Text',
  Comment: 'Comment',
  Cdata: 'Cdata',
  Doctype: 'Doctype',
  Tag: 'Tag',
};
export function parseXMLChunkBuffer(buffer: string, handler: SimpleSAXHandler): string {
  try {
    let state = ParseState.Text;
    let cursor = 0;
    let acc = ''; // 一時蓄積用

    while (cursor < buffer.length) {
      switch (state) {
        case ParseState.Text: {
          const nextOpen = buffer.indexOf('<', cursor);
          const text = nextOpen === -1 ? buffer.slice(cursor) : buffer.slice(cursor, nextOpen);
          if (text.trim()) handler.onText?.(new TextEvent(text));
          if (nextOpen === -1) return ''; // 全部処理済み
          cursor = nextOpen;

          // 判別開始
          if (buffer.startsWith('<!--', cursor)) {
            state = ParseState.Comment;
            acc = '';
            cursor += 4;
          } else if (buffer.startsWith('<![CDATA[', cursor)) {
            state = ParseState.Cdata;
            acc = '';
            cursor += 9;
          } else if (buffer.startsWith('<!DOCTYPE', cursor)) {
            state = ParseState.Doctype;
            acc = '<!DOCTYPE';
            cursor += 9;
          } else {
            state = ParseState.Tag;
            acc = '<';
            cursor++;
          }
          break;
        }

        case ParseState.Comment: {
          const end = buffer.indexOf('-->', cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return '<!--' + acc;
          }
          acc += buffer.slice(cursor, end);
          handler.onComment?.(new CommentEvent(acc));
          cursor = end + 3;
          state = ParseState.Text;
          break;
        }

        case ParseState.Cdata: {
          const end = buffer.indexOf(']]>', cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return '<![CDATA[' + acc;
          }
          acc += buffer.slice(cursor, end);
          handler.onCdata?.(new CdataEvent(acc));
          cursor = end + 3;
          state = ParseState.Text;
          break;
        }

        case ParseState.Doctype: {
          const end = buffer.indexOf('>', cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return acc;
          }
          acc += buffer.slice(cursor, end + 1);
          handler.onDtd?.(new DtdEvent(acc));
          cursor = end + 1;
          state = ParseState.Text;
          break;
        }

        case ParseState.Tag: {
          const end = buffer.indexOf('>', cursor);
          if (end === -1) {
            acc += buffer.slice(cursor);
            return acc;
          }
          acc += buffer.slice(cursor, end + 1);
          processTag(acc, handler); // タグのパース処理に委譲
          cursor = end + 1;
          state = ParseState.Text;
          break;
        }
      }
    }

    return ''; // 全処理済み
  } catch (err: unknown) {
    handler.onError?.(err instanceof Error ? err : new Error(String(err)));
    return buffer;
  }
}

function processTag(source: string, handler: SimpleSAXHandler) {
  const tagMatch = /^<\/?([a-zA-Z0-9_:.-]+)([^>]*)\/?>$/.exec(source.trim());
  if (!tagMatch) {
    handler.onError?.(new Error(`Invalid tag syntax: ${source}`));
    return;
  }

  const [, tagName, attrStrRaw] = tagMatch;
  const isClosing = source.startsWith('</');
  const isSelfClosing = source.endsWith('/>') || attrStrRaw.trimEnd().endsWith('/');

  if (isClosing) {
    handler.onEndElement?.(new EndElementEvent(tagName));
    return;
  }

  const attrStr = (() => {
    if (attrStrRaw.endsWith("/")) {
      return attrStrRaw.slice(0, -1).trim();
    }
    return attrStrRaw.trim();
  })();
  const attrs: Record<string, string> = {};
  let match: RegExpExecArray | null;

  const attrRegex = /\s*([a-zA-Z0-9_:.-]+)=(?:"([^"]*)"|'([^']*)')/g;
  let prevIndex = 0;

  while ((match = attrRegex.exec(attrStr))) {
    const [, key, val1, val2] = match;
    attrs[key] = val1 ?? val2 ?? '';
    prevIndex = attrRegex.lastIndex;
  }

  const remaining = attrStr.slice(prevIndex).trim();
  if (remaining.length > 0) {
    handler.onError?.(new Error(`Invalid or unquoted attribute syntax near: ${remaining}`));
  }

  handler.onStartElement?.(new StartElementEvent(tagName, attrs, isSelfClosing));
  if (isSelfClosing) {
    handler.onEndElement?.(new EndElementEvent(tagName));
  }
}
