import type { SimpleApiParser } from "../interface";
import { assertIsDefined, assertIsTrue, toErrorMessage, functionToName as toState } from "../utils";
import { EndArrayEvent, EndDocumentEvent, EndObjectEvent, KeyEvent, StartArrayEvent, StartDocumentEvent, StartObjectEvent, ValueBooleanEvent, ValueNullEvent, ValueNumberEvent, ValueStringEvent } from "./event";
import type { SAJHandler } from "./interface";

export class JSONTextToSAJParserError extends Error implements Status {
  buffer: string;
  pos: number;
  state: string;
  acc: string;
  key: string | null;
  typeStack: ("object" | "array")[];
  constructor(message: string, status: Status, options?: ErrorOptions) {
    super(message, options);
    this.name = "JSONTextToSAJParserError";
    ({
      buffer: this.buffer,
      pos: this.pos,
      state: this.state,
      acc: this.acc,
      key: this.key,
      typeStack: this.typeStack,
    } = status);

  }
}

type StateFunction = (ch: Ch) => void;
type Status = {
  get buffer(): string;
  get pos(): number;
  get state(): string;
  get acc(): string;
  get key(): string | null;
  get typeStack(): ("object" | "array")[];
};

export type JSONTextToSAJParserAdditionalHandler = {
  onParseBefore(arg: Status): void;
  onParseRoopBefore(arg: Status): void;
  onParseRoopAfter(arg: Status): void;
  onParseAfter(arg: Status): void;
}
const EOL = Symbol.for("JSONTextToSAJParser.EOL");

type Ch = string | typeof EOL;

export class JSONTextToSAJParser implements SimpleApiParser<string> {
  /** text buffer */
  #buffer = '';
  /** read position */
  #pos = 0;
  /** read state */
  #state: StateFunction = this.#startDocument;

  #acc = '';
  #key: string | null = null;
  #stack: ('object' | 'array')[] = [];
  #handler: Partial<SAJHandler & JSONTextToSAJParserAdditionalHandler>;
  #skipDocument: boolean;
  #startDocumented: boolean = false;
  #multiple: boolean = false;

  #status(): Status {
    return {
      buffer: this.#buffer,
      pos: this.#pos,
      state: toState(this.#state, "#parse"),
      acc: this.#acc,
      key: this.#key,
      typeStack: this.#stack.slice(),
    };
  }

  get status() {
    return this.#status();
  }

  /**
   * make error new SimpleSAXParseXMLBufferError
   * @param message error message
   * @param options error option
   * @returns
   */
  #makeError(message: string | Error, options?: ErrorOptions) {
    ({message, options} = toErrorMessage(message, options));
    return new JSONTextToSAJParserError(message, this.#status(), options);
  }

  constructor({ handler, skipDocument, multiple }: { handler: Partial<SAJHandler & JSONTextToSAJParserAdditionalHandler>, skipDocument?: boolean, multiple?: boolean }) {
    this.#handler = handler;
    this.#skipDocument = skipDocument ?? false;
    this.#multiple = multiple ?? false;
  }

  /**
   * make syntax error
   * @param message
   * @param source
   * @returns
   */
  #makeSyntaxError(message: string, source: string) {
    const error = this.#makeError(`${message}: ${source}`);
    (error as unknown as Record<string, string>).syntax = source;
    return error;
  }

  /**
   * make not complete error
   * @returns
   */
  #makeNotCompleteError() {
    return this.#makeError(`not complete syntax error. buffer:${this.#buffer}`);
  }

  enqueue(chunk: string): void {
    this.#buffer += chunk;
    this.#parse();
  }

  flush(): void {
    this.#parse(true);
  }

  #parse(isFlush = false) {
    this.#handler.onParseBefore?.(this.#status());
    try {
      while (this.#pos < this.#buffer.length) {
        this.#handler.onParseRoopBefore?.(this.#status());
        const ch = this.#buffer[this.#pos++];
        this.#state(ch);
        this.#handler.onParseRoopAfter?.(this.#status());
      }
      if (isFlush && this.#pos === this.#buffer.length) {
        this.#state(EOL);
        if (this.#state === this.#endDocument) {
          this.#state(EOL);
        }
      }
      if (isFlush) {
        assertIsTrue(this.#state === this.#startDocument, `finish state is startDocument`);
      }
    } catch (e: unknown) {
      this.#handler.onError?.(e);
    } finally {
      this.#handler.onParseAfter?.(this.#status());
    }
  }

  #endDocument(ch?: Ch) {
    assertIsTrue(this.#startDocumented, "mismatch not start document");
    if (ch !== EOL && ch !== undefined) {
      this.#pos--;
    }
    if (!this.#skipDocument)
      this.#handler.onEndDocument?.(new EndDocumentEvent());
    this.#startDocumented = false;
    if (!this.#multiple && ch !== EOL) {
      this.#state = this.#closedDocument;
      return;
    }
    this.#state = this.#startDocument;
  }
  #closedDocument() {
    throw this.#makeError("is closed document");
  }

  #startDocument(ch: Ch) {
    if (ch === EOL) return;
    if (/\s/.test(ch)) return;

    if (!this.#startDocumented) {
      if (!this.#skipDocument)
        this.#handler.onStartDocument?.(new StartDocumentEvent());
      this.#startDocumented = true;
    }
    switch (ch) {
      case '{':
        this.#handler.onStartObject?.(new StartObjectEvent());
        this.#stack.push('object');
        this.#state = this.#parseKeyOrEndObject;
        return;
      case '[':
        this.#handler.onStartArray?.(new StartArrayEvent());
        this.#stack.push('array');
        this.#state = this.#parseValueOrEndArray;
        return;
      case '"':
        this.#acc = '';
        this.#state = this.#parseString(this.#handleStandaloneValue);
        return;
      case 't':
      case 'f':
      case 'n':
        this.#acc = ch;
        this.#state = this.#parseLiteral(this.#handleStandaloneValue);
        return;
      case '-':
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        this.#acc = ch;
        this.#state = this.#parseNumber(this.#handleStandaloneValue);
        return;
    }
    throw this.#makeSyntaxError(`Unexpected token`, ch);
  };

  #handleStandaloneValue<T extends number | string | boolean | null>(val: T) {
    this.#state = this.#endDocument;
    this.#handler.onValue?.(this.#wrapValue(val));
  };

  #wrapValue<T extends number | string | boolean | null>(val: T) {
    if (typeof val === 'string') return new ValueStringEvent("string", val);
    if (typeof val === 'number') return new ValueNumberEvent("number", val);
    if (typeof val === 'boolean') return new ValueBooleanEvent("boolean", val);
    return new ValueNullEvent("null");
  }

  #parseKeyOrEndObject(ch: Ch) {
    if (ch === EOL) throw this.#makeNotCompleteError();
    if (/\s/.test(ch)) return;
    if (ch === '}') {
      this.#handler.onEndObject?.(new EndObjectEvent());
      this.#stack.pop();
      this.#state = this.#parseAfterValue;
      return;
    } else if (ch === '"') {
      this.#acc = '';
      this.#state = this.#parseString((key) => {
        this.#key = key;
        this.#handler.onKey?.(new KeyEvent(key));
        this.#state = this.#parseColon;
      });
      return;
    }
    throw this.#makeSyntaxError(`Unexpected token in object`, ch);
  };

  #parseColon(ch: Ch) {
    if (ch === EOL) throw this.#makeNotCompleteError();
    if (/\s/.test(ch)) return;
    if (ch === ':') {
      this.#state = this.#parseValue;
      return;
    }
    throw this.#makeSyntaxError(`Expected colon after key but got`, ch);
  };

  #parseValue(ch: Ch) {
    if (ch === EOL) throw this.#makeNotCompleteError();
    if (/\s/.test(ch)) return;

    switch (ch) {
      case '"':
        this.#acc = '';
        this.#state = this.#parseString(this.#emitKeyValue);
        return;
      case '{':
        this.#handler.onStartObject?.(new StartObjectEvent());
        this.#stack.push('object');
        this.#state = this.#parseKeyOrEndObject;
        return;
      case '[':
        this.#handler.onStartArray?.(new StartArrayEvent());
        this.#stack.push('array');
        this.#state = this.#parseValueOrEndArray;
        return;
      case 't':
      case 'f':
      case 'n':
        this.#acc = ch;
        this.#state = this.#parseLiteral(this.#emitKeyValue);
        return;
      default:
        if (ch === '-' || /\d/.test(ch)) {
          this.#acc = ch;
          this.#state = this.#parseNumber(this.#emitKeyValue);
          return;
        }
    }
    throw this.#makeSyntaxError(`Unexpected value`, ch);
  };

  #emitKeyValue<T extends string | number | boolean | null>(val: T) {
    this.#handler.onValue?.(this.#wrapValue(val));
    this.#key = null;
    const parent = this.#stack.at(-1);
    assertIsTrue(!!parent, "not have parent");
    if (parent === "object")
      this.#state = this.#parseCommaOrEndObject;
    else if (parent === "array")
      this.#state = this.#parseCommaOrEndArray;
  };

  #parseCommaOrEndObject(ch: Ch) {
    if (ch === EOL) throw this.#makeNotCompleteError();
    if (/\s/.test(ch)) return;
    if (ch === ',') {
      this.#state = this.#parseKeyOrEndObject;
      return;
    } else if (ch === '}') {
      this.#handler.onEndObject?.(new EndObjectEvent());
      this.#stack.pop();
      this.#state = this.#parseAfterValue;
      return;
    }
    throw this.#makeSyntaxError(`Expected , or } but got`, ch);
  };

  #parseValueOrEndArray(ch: Ch) {
    if (ch === EOL) throw this.#makeNotCompleteError();
    if (/\s/.test(ch)) return;
    if (ch === ']') {
      this.#handler.onEndArray?.(new EndArrayEvent());
      this.#stack.pop();
      this.#state = this.#parseAfterValue;
      return;
    }

    this.#pos--; // unread
    this.#state = this.#parseValueInArray;
  };

  #parseValueInArray(ch: Ch) {
    if (ch === EOL) throw this.#makeNotCompleteError();
    this.#parseValue(ch);
  };

  #parseCommaOrEndArray(ch: Ch) {
    if (ch === EOL) throw this.#makeNotCompleteError();
    if (/\s/.test(ch)) return;
    if (ch === ',') {
      this.#state = this.#parseValueInArray;
      return;
    } else if (ch === ']') {
      this.#handler.onEndArray?.(new EndArrayEvent());
      this.#stack.pop();
      this.#state = this.#parseAfterValue;
      return;
    }
    throw this.#makeSyntaxError(`Expected , or ] but got`, ch);
  };

  #parseAfterValue(ch: Ch) {
    if (ch === EOL) {
      if (this.#stack.length > 0)
        // まだ未閉じの構造がある → 不完全エラー
        throw this.#makeNotCompleteError();
      this.#state = this.#endDocument;
      return;
    }
    if (/\s/.test(ch)) return;
    const parent = this.#stack.at(-1);
    assertIsDefined(parent, "not have parent");
    if (parent === 'object') {
      this.#pos--;
      this.#state = this.#parseCommaOrEndObject;
      return;
    }
    if (parent === 'array') {
      this.#pos--;
      this.#state = this.#parseCommaOrEndArray;
      return;
    }
  };

  #parseString(onEnd: (this: typeof this, s: string) => void): StateFunction {
    let escape = false;
    let unicode: string | null = null;
    const parseStringHandler: StateFunction = (ch) => {
      if (ch === EOL) throw this.#makeNotCompleteError();
      if (escape) {
        if (unicode !== null) {
          // unicode モード中
          if (!/[0-9a-fA-F]/.test(ch)) {
            throw this.#makeSyntaxError(`Invalid unicode escape`, ch);
          }
          unicode += ch;
          if (unicode.length === 4) {
            this.#acc += String.fromCharCode(parseInt(unicode, 16));
            unicode = null;
            escape = false;
          }
        } else if (ch === 'u') {
          // unicode エスケープ開始
          unicode = '';
        } else {
          const esc = {
            '"': '"', '\\': '\\', '/': '/',
            b: '\b', f: '\f', n: '\n', r: '\r', t: '\t'
          }[ch];
          if (esc === undefined) throw this.#makeSyntaxError(`Invalid escape: \\${ch}`, ch);
          this.#acc += esc;
          escape = false;
        }
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        onEnd.call(this, this.#acc);
      } else {
        this.#acc += ch;
      }
    };
    return parseStringHandler;
  };

  #parseLiteral(onEnd: (this: typeof this, val: string | boolean | null) => void): StateFunction {
    const parseLiteralHandler: StateFunction = (ch) => {
      if (ch === EOL) throw this.#makeNotCompleteError();
      this.#acc += ch;
      if (/^(true|false|null)$/.test(this.#acc)) {
        const val = this.#acc === 'true' ? true :
          this.#acc === 'false' ? false : null;
        this.#state = this.#endDocument;
        onEnd.call(this, val);
      } else if (!["true", "false", "null"].some(prefix => prefix.startsWith(this.#acc))) {
        throw this.#makeSyntaxError(`Invalid literal`, this.#acc);
      }
    };
    return parseLiteralHandler;
  };

  #parseNumber(onEnd: (this: typeof this, val: number) => void): StateFunction {
    const parseNumberHandler: StateFunction = (ch) => {
      if (ch !== EOL && /[0-9eE+.-]/.test(ch)) {
        this.#acc += ch;
      } else {
        if (ch !== EOL)
          this.#pos--; // unread
        const num = Number(this.#acc);
        if (Number.isNaN(num)) {
          throw this.#makeSyntaxError(`Invalid number`, this.#acc);
        }
        this.#state = this.#endDocument;
        onEnd.call(this, num);
      }
    };
    return parseNumberHandler;
  };
}
