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
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(_buffer)) !== null) {
      const [full, slash, tagName, attrStr, textContent] = match;
      let textContent_:string|undefined;
      if (textContent !== undefined && (textContent_ = textContent.trim())) {
        handler.onText?.(new TextEvent(textContent_));
      } else if (tagName) {
        const isClosing = slash === "/";
        const selfClosing = /\/\s*>$/.test(full);
        const attrs: Record<string, string> = {};

        // 属性の簡易パース（ダブルクォートのみ）
        const attrRegex = /([a-zA-Z0-9_:.-]+)="([^"]*)"/g;
        let attrMatch: RegExpExecArray | null;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
          attrs[attrMatch[1]] = attrMatch[2];
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
  } catch (err) {
    handler.onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}
