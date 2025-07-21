export interface SimpleSAXHandler {
  onStartElement?: (name: string, attrs: Record<string, string>, selfClosing: boolean) => void;
  onEndElement?: (name: string) => void;
  onText?: (text: string) => void;
  onError?: (err: Error) => void;
}

export class SimpleSAXWritableStream extends WritableStream<string> {
  #buffer = "";

  constructor(handler: SimpleSAXHandler) {
    super({
      write: (chunk: string) => {
        this.#buffer += chunk;
        this.#parseBuffer(handler);
      },
      close: () => {
        this.#parseBuffer(handler);
      },
      abort: (reason: unknown) => {
        handler.onError?.(reason instanceof Error ? reason : new Error(String(reason)));
      }
    });
  }

  #parseBuffer(handler: SimpleSAXHandler) {
    if (!this.#buffer.trim()) return;
    try {
      const tagRegex = /<(\/?)([a-zA-Z0-9_:.-]+)([^>]*)>|([^<]+)/g;
      let match: RegExpExecArray | null;

      while ((match = tagRegex.exec(this.#buffer)) !== null) {
        const [full, slash, tagName, attrStr, textContent] = match;

        if (textContent !== undefined && textContent.trim()) {
          handler.onText?.(textContent.trim());
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
            handler.onEndElement?.(tagName);
          } else {
            handler.onStartElement?.(tagName, attrs, selfClosing);
            if (selfClosing) {
              handler.onEndElement?.(tagName);
            }
          }
        }
      }

      // 全処理後バッファクリア（今回の設計では都度全消し）
      this.#buffer = "";
    } catch (err) {
      handler.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
