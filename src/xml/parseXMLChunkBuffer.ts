import { SimpleSAXHandler } from "./SimpleSAXHandler";
import { StartElementEvent } from "./event/StartElementEvent";
import { EndElementEvent } from "./event/EndElementEvent";
import { TextEvent } from "./event/TextEvent";



export function parseXMLChunkBuffer(buffer: string[], handler: SimpleSAXHandler) {
  if (buffer.length <= 0) return;
  const _buffer = buffer.join("");
  if (!_buffer.trim()) return;
  try {
    const tagRegex = /<(\/?)([a-zA-Z0-9_:.-]+)([^>]*)>|([^<]+)/g;
    let prevlastIndex = 0;
    for (const match of next(tagRegex, (_buffer))) {
      const [, slash, tagName, attrStr_, textContent] = match;
      prevlastIndex = match.lastIndex;
      let textContent_: string | undefined;
      if (textContent !== undefined && (textContent_ = textContent.trim())) {
        handler.onText?.(new TextEvent(textContent_));
      } else if (tagName) {
        const isClosing = slash === "/";
        const selfClosing = attrStr_?.endsWith("/");
        const attrStr = selfClosing ? attrStr_.slice(0, -1).trimEnd() : attrStr_.trimEnd();
        const attrs: Record<string, string> = {};

        // 属性の簡易パース（ダブルクォートのみ）
        const attrRegex = /\s*([a-zA-Z0-9_:.-]+)=(?="([^"]*)"|'([^']*)'|([^'"]*))\s*/g;
        let prevLast = 0;
        for (const { 1: attr, 2: value1, 3: value2, 4: invalid, lastIndex } of next(attrRegex, attrStr)) {
          if (invalid !== undefined) throw new Error(`Invalid attribute format: ${invalid}. required ' or "`, { cause: { index: prevLast, lastIndex } });
          attrs[attr] = value1 ?? value2;;
          prevLast = lastIndex;
        }
        if (prevLast < attrStr.length) {
          const after = attrStr.substring(prevLast).trim();
          if (after.length > 0)
            throw new Error(`Invalid attribute format: ${after}. `, { cause: { index: prevLast, lastIndex: attrStr.length } });
        }

        if (isClosing) {
          handler.onEndElement?.(new EndElementEvent(tagName));
        } else {
          handler.onStartElement?.(new StartElementEvent(tagName, attrs, selfClosing));
          if (selfClosing) {
            handler.onEndElement?.(new EndElementEvent(tagName));
          }
        }
      }
    }

    // 全処理後バッファクリア（今回の設計では都度全消し）
    buffer.splice(0, buffer.length);

    if (prevlastIndex < _buffer.length) {
      const remainingText = _buffer.substring(prevlastIndex);
      buffer.push(remainingText);
    }

  } catch (err) {
    handler.onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}

function* next(regexp: RegExp, test: string) {
  let matches: RegExpExecArray | null;
  while ((matches = regexp.exec(test)) !== null) {
    yield matches;
  }
}

