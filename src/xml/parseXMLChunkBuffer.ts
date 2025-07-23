import { SimpleSAXHandler } from "./interface/SimpleSAXHandler";
import { StartElementEvent } from "./event/StartElementEvent";
import { EndElementEvent } from "./event/EndElementEvent";
import { TextEvent } from "./event/TextEvent";
import { CdataEvent, CommentEvent, DtdEvent } from "./event";



export function parseXMLChunkBuffer(buffer: string, handler: SimpleSAXHandler): string {
  if (buffer.length <= 0) return buffer;
  try {
    const tagRegex =  /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<(\/?)([a-zA-Z0-9_:.-]+)([^>]*)>|([^<]+)/g;
    let prevlastIndex = 0;
    for (const match of next(tagRegex, (buffer))) {
      const [full, slash, tagName, attrStr_, textContent] = match;
      console.dir({ full, slash, tagName, attrStr_, textContent });
      if (full.startsWith("<!--")) {
        if (!full.endsWith("-->")) return buffer;
        const comment = full.slice(4, -3).trim();
        handler.onComment?.(new CommentEvent(comment));
        continue;
      }
      if (full.startsWith("<![CDATA[")) {
        if (!full.endsWith("]]>")) return buffer;
        const cdata = full.slice(9, -3);
        handler.onCdata?.(new CdataEvent(cdata));
        continue;
      }
      if (full.startsWith("<!DOCTYPE")) {
        if (!full.endsWith(">")) return buffer;
        const doctype = full;
        handler.onDtd?.(new DtdEvent(doctype));
        continue;
      }
      prevlastIndex = match.lastIndex;
      let textContent_: string | undefined;
      if (textContent !== undefined && (textContent_ = textContent.trim())) {
        handler.onText?.(new TextEvent(textContent_));
        continue;
      }
      if (tagName) {
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

    if (prevlastIndex < buffer.length) {
      const remainingText = buffer.substring(prevlastIndex);
      return remainingText;
    }
    return "";

  } catch (err) {
    handler.onError?.(err instanceof Error ? err : new Error(String(err)));
    return buffer;
  }
}

function* next(regexp: RegExp, test: string) {
  let matches: RegExpExecArray | null;
  while ((matches = regexp.exec(test)) !== null) {
    yield matches;
  }
}

