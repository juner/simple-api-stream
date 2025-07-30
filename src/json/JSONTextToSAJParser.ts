import type { SimpleApiParser } from "../interface";
import { EndArrayEvent, EndObjectEvent, KeyEvent, StartArrayEvent, StartObjectEvent, ValueBooleanEvent, ValueNullEvent, ValueNumberEvent, ValueStringEvent } from "./event";
import type { SAJHandler } from "./interface/SAJHandler";

export class JSONTextToSAJParserError extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
    this.name = "XMLTextToSAXParserError";
  }
}

type StateFunction = (ch: string) => void;
type Status = {
  buffer: string;
  pos: number;
  state: string;
  acc: string;
  key: string | null;
  stack: ("object" | "array")[];
};

export type JSONTextToSAJParserAdditionalHandler = {
  onParseBefore(arg: Status): void;
  onParseRoopBefore(arg: Status): void;
  onParseRoopAfter(arg: Status): void;
  onParseAfter(arg: Status): void;
}

export class JSONTextToSAJParser implements SimpleApiParser<string> {

  #buffer = '';
  #pos = 0;
  #state: StateFunction = this.#parseDefault;
  #acc = '';
  #key: string | null = null;
  #stack: ('object' | 'array')[] = [];
  #handler: Partial<SAJHandler & JSONTextToSAJParserAdditionalHandler>;

  #status() {
    return {
      buffer: this.#buffer,
      pos: this.#pos,
      state: toState(this.#state),
      acc: this.#acc,
      key: this.#key,
      stack: this.#stack.slice(),
    };
    function toState(state: StateFunction) {
      if (state.name.startsWith("#parse")) {
        return state.name.slice("#parse".length);
      }
      if (state.name.startsWith("#")) {
        return state.name.slice('#'.length);
      }
      if (state.name.startsWith("parse")) {
        return state.name.slice("parse".length);
      }
      return state.name;
    }
  }

  /**
   * make error new SimpleSAXParseXMLBufferError
   * @param message error message
   * @param options error option
   * @returns
   */
  #makeError(message: string, options?: ConstructorParameters<typeof Error>[1]) {
    const cause = {
      instance: this,
      status: this.#status(),
      ...(options?.cause ?? {})
    };
    (options ??= {}).cause = cause;
    return new JSONTextToSAJParserError(message, options);
  }

  constructor({ handler }: { handler: Partial<SAJHandler & JSONTextToSAJParserAdditionalHandler> }) {
    this.#handler = handler;
  }

  /**
   * make syntax error
   * @param message
   * @param source
   * @returns
   */
  #makeSyntaxError(message: string, source: string) {
    return this.#makeError(`${message}: ${source}`, {
      cause: {
        syntax: source,
      }
    });
  }

  enqueue(chunk: string): void {
    this.#buffer += chunk;
    try {
      this.#parse();
    } catch (err) {
      this.#handler.onError?.(err);
    }
  }

  flush(): void {
    try {
      this.#parse(true);
    } catch (err) {
      this.#handler.onError?.(err);
    }
  }

  #parse(isFlush = false) {
    this.#handler.onParseBefore?.(this.#status());
    while (this.#pos < this.#buffer.length) {
      this.#handler.onParseRoopBefore?.(this.#status());
      const ch = this.#buffer[this.#pos++];
      this.#state(ch);
      this.#handler.onParseRoopAfter?.(this.#status());
    }

    if (isFlush && this.#state !== this.#parseDefault) {
      throw this.#makeError('Unexpected EOF');
    }
    this.#handler.onParseAfter?.(this.#status());
  }

  #parseDefault(ch: string) {
    if (/\s/.test(ch)) return;

    switch (ch) {
      case '{':
        this.#handler.onStartObject?.(new StartObjectEvent());
        this.#stack.push('object');
        this.#state = this.#parseKeyOrEndObject;
        break;
      case '[':
        this.#handler.onStartArray?.(new StartArrayEvent());
        this.#stack.push('array');
        this.#state = this.#parseValueOrEndArray;
        break;
      case '"':
        this.#acc = '';
        this.#state = this.#parseString(this.#handleStandaloneValue);
        break;
      case 't':
      case 'f':
      case 'n':
        this.#acc = ch;
        this.#state = this.#parseLiteral(this.#handleStandaloneValue);
        break;
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
        break;
      default:
        throw this.#makeSyntaxError(`Unexpected token`, ch);
    }
  };

  #handleStandaloneValue<T extends number | string | boolean | null>(val: T) {
    this.#state = this.#parseDefault;
    this.#handler.onValue?.(this.#wrapValue(val));
  };

  #wrapValue<T extends number | string | boolean | null>(val: T) {
    if (typeof val === 'string') return new ValueStringEvent("string", val);
    if (typeof val === 'number') return new ValueNumberEvent("number", val);
    if (typeof val === 'boolean') return new ValueBooleanEvent("boolean", val);
    return new ValueNullEvent("null");
  }

  #parseKeyOrEndObject(ch: string) {
    if (/\s/.test(ch)) return;
    if (ch === '}') {
      this.#handler.onEndObject?.(new EndObjectEvent());
      this.#stack.pop();
      if (this.#stack.at(-1))
        this.#state = this.#parseAfterValue;
      else
        this.#state = this.#parseDefault;
    } else if (ch === '"') {
      this.#acc = '';
      this.#state = this.#parseString((key) => {
        this.#key = key;
        this.#handler.onKey?.(new KeyEvent(key));
        this.#state = this.#parseColon;
      });
    } else {
      throw this.#makeSyntaxError(`Unexpected token in object`, ch);
    }
  };

  #parseColon(ch: string) {
    if (/\s/.test(ch)) return;
    if (ch === ':') {
      this.#state = this.#parseValue;
    } else {
      throw this.#makeSyntaxError(`Expected colon after key but got`, ch);
    }
  };

  #parseValue(ch: string) {
    if (/\s/.test(ch)) return;

    switch (ch) {
      case '"':
        this.#acc = '';
        this.#state = this.#parseString(this.#emitKeyValue);
        break;
      case '{':
        this.#handler.onStartObject?.(new StartObjectEvent());
        this.#stack.push('object');
        this.#state = this.#parseKeyOrEndObject;
        break;
      case '[':
        this.#handler.onStartArray?.(new StartArrayEvent());
        this.#stack.push('array');
        this.#state = this.#parseValueOrEndArray;
        break;
      case 't':
      case 'f':
      case 'n':
        this.#acc = ch;
        this.#state = this.#parseLiteral(this.#emitKeyValue);
        break;
      default:
        if (ch === '-' || /\d/.test(ch)) {
          this.#acc = ch;
          this.#state = this.#parseNumber(this.#emitKeyValue);
        } else {
          throw this.#makeSyntaxError(`Unexpected value`, ch);
        }
    }
  };

  #emitKeyValue<T extends string | number | boolean | null>(val: T) {
    this.#handler.onValue?.(this.#wrapValue(val));
    this.#key = null;
    const parent = this.#stack.at(-1);
    if (parent === "object")
      this.#state = this.#parseCommaOrEndObject;
    else if (parent === "array")
      this.#state = this.#parseCommaOrEndArray;
  };

  #parseCommaOrEndObject(ch: string) {
    if (/\s/.test(ch)) return;
    if (ch === ',') {
      this.#state = this.#parseKeyOrEndObject;
    } else if (ch === '}') {
      this.#handler.onEndObject?.(new EndObjectEvent());
      this.#stack.pop();
      if (this.#stack.at(-1))
        this.#state = this.#parseAfterValue;
      else
        this.#state = this.#parseDefault;
    } else {
      throw this.#makeSyntaxError(`Expected , or } but got`, ch);
    }
  };

  #parseValueOrEndArray(ch: string) {
    if (/\s/.test(ch)) return;
    if (ch === ']') {
      this.#handler.onEndArray?.(new EndArrayEvent());
      this.#stack.pop();
      this.#state = this.#parseAfterValue;
    } else {
      this.#pos--; // unread
      this.#state = this.#parseValueInArray;
    }
  };

  #parseValueInArray(ch: string) {
    this.#state = this.#parseCommaOrEndArray;
    this.#parseValue(ch);
  };

  #parseCommaOrEndArray(ch: string) {
    if (/\s/.test(ch)) return;
    if (ch === ',') {
      this.#state = this.#parseValueInArray;
    } else if (ch === ']') {
      this.#handler.onEndArray?.(new EndArrayEvent());
      this.#stack.pop();
      if (this.#stack.at(-1))
        this.#state = this.#parseAfterValue;
      else
        this.#state = this.#parseDefault;
    } else {
      throw this.#makeSyntaxError(`Expected , or ] but got`, ch);
    }
  };

  #parseAfterValue(ch: string) {
    if (/\s/.test(ch)) return;
    const parent = this.#stack.at(-1);
    if (parent === 'object') {
      this.#pos--;
      this.#state = this.#parseCommaOrEndObject;
      return;
    } else if (parent === 'array') {
      this.#pos--;
      this.#state = this.#parseCommaOrEndArray;
      return;
    } else {
      this.#pos--;
      this.#state = this.#parseDefault;
      return;
    }
  };

  #parseString(onEnd: (this: typeof this, s: string) => void): StateFunction {
    let escape = false;
    let unicode = '';
    const parseStringHandler: StateFunction = (ch) => {
      if (escape) {
        if (unicode !== '') {
          unicode += ch;
          if (unicode.length === 4) {
            this.#acc += String.fromCharCode(parseInt(unicode, 16));
            unicode = '';
            escape = false;
          }
        } else if (ch === 'u') {
          unicode = '';
        } else {
          const esc = {
            '"': '"', '\\': '\\', '/': '/',
            b: '\b', f: '\f', n: '\n', r: '\r', t: '\t'
          }[ch];
          if (esc === undefined) throw this.#makeError(`Invalid escape: \\${ch}`, { cause: { syntax: ch } });
          this.#acc += esc;
          escape = false;
        }
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        this.#state = this.#parseDefault;
        onEnd.call(this, this.#acc);
      } else {
        this.#acc += ch;
      }
    };
    return parseStringHandler;
  };

  #parseLiteral(onEnd: (this: typeof this, val: string | boolean | null) => void): StateFunction {
    const parseLiteralHandler: StateFunction = (ch) => {
      this.#acc += ch;
      if (/^(true|false|null)$/.test(this.#acc)) {
        const val = this.#acc === 'true' ? true :
          this.#acc === 'false' ? false : null;
        this.#state = this.#parseDefault;
        onEnd.call(this, val);
      } else if (!["true", "false", "null"].some(prefix => prefix.startsWith(this.#acc))) {
        throw this.#makeSyntaxError(`Invalid literal`, this.#acc);
      }
    };
    return parseLiteralHandler;
  };

  #parseNumber(onEnd: (this: typeof this, val: number) => void): StateFunction {
    const parseNumberHandler: StateFunction = (ch) => {
      if (/[0-9eE+.-]/.test(ch)) {
        this.#acc += ch;
      } else {
        this.#pos--; // unread
        const num = Number(this.#acc);
        if (Number.isNaN(num)) {
          throw this.#makeSyntaxError(`Invalid number`, this.#acc);
        }
        this.#state = this.#parseDefault;
        onEnd.call(this, num);
      }
    };
    return parseNumberHandler;
  };
}
