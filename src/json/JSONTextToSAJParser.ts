import { SAJHandler } from "./interface/SAJHandler";

const BLOCK_START = "{";
const BLOCK_END = "}";
const ARRAY_START = "[";
const ARRAY_END = "]";
const STRING_START = "\"";
const STRING_END = "\"";
const ESCAPED_STRING = "\\\"";
const SEPARATOR = ",";

const SPACE = " \r\n\t";

export class JSONTextToSAJParserError extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
    this.name = "XMLTextToSAXParserError";
  }
}

export class JSONTextToSAJParser {
  #buffer: string = "";
  #handler: Partial<SAJHandler>;
  #acc: string = "";
  #cursor: number = 0;
  #factor: (flush: boolean) => { required?: true };

  get buffer() {
    return this.#buffer;
  }

  get state() {
    return this.#factor.name.slice(1);
  }

  get acc() {
    return this.#acc;
  }

  #status() {
    return {
      buffer: this.#buffer,
      state: this.state,
      acc: this.#acc,
    };
  }

  constructor({ handler }: { handler: Partial<SAJHandler> }) {
    this.#handler = handler;
    this.#factor = this.#nofactor;
  }

  enqueue(chunk: string) {
    this.#buffer += chunk;
    this.#parseBuffer();
  }

  flush() {
    this.#parseBuffer(true);
  }

  error(reasone: unknown) {
    this.#handler?.onError?.(reasone);
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

  /**
   * make not complete error
   * @returns
   */
  #makeNotCompleteError() {
    return this.#makeError(`not complete syntax error. buffer:${this.#buffer}`);
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
  #parseBuffer(flush: boolean = false): void {
    try {
      this.#cursor = 0;
      while (this.#cursor < this.#buffer.length) {
        const { required } = this.#factor(flush);
        if (required)
          if (flush) this.#makeNotCompleteError();
          else return;
      }
      if (flush && this.#acc.length > 0) {
        this.#makeNotCompleteError();
      }
      this.#buffer = "";
      return;
    } catch (error: unknown) {
      this.#handler.onError?.(error instanceof Error
        ? error
        : this.#makeError(String(error), {
          cause: {
            instance: this,
          }
        })
      );
    }
  }
  #nofactor(): { required?: true } {
    if (this.#cursor == 0 && this.#buffer.length > 0) {
      const indexOf = Array.prototype.findIndex.call(this.#buffer, (char) => {
        for (const s of SPACE) {
          if (s !== char) return true;
        }
        return false;
      });
      if (indexOf < 0) {
        this.#buffer = "";
        return {required: true};
      }
    }
    return {};
  }
}
