import { describe, expect } from "vitest";
import { json } from "..";
import { JSONTextToSAJTransformStream } from "..";

type SAJEventInterface = json.eventInterface.SAJEventInterface;
describe("pattern", (it) => {
  const entries: {
    name: string;
    options?: ConstructorParameters<typeof JSONTextToSAJTransformStream>[0],
    input: string[];
    output: SAJEventInterface[];
  }[] = [
      {
        name: "all type",
        input: [
          `{"num":0,"str":"value", \n`,
          `"bool1": true, "bool2": false, "nullable":null,   "arry": [
        "test"
        ]}`,
        ],
        output: [
          { name: "startDocument", kind: "json" },
          { name: "startObject" },
          { name: "key", key: "num" },
          { name: "value", type: "number", value: 0 },
          { name: "key", key: "str" },
          { name: "value", type: "string", value: "value" },
          { name: "key", key: "bool1" },
          { name: "value", type: "boolean", value: true },
          { name: "key", key: "bool2" },
          { name: "value", type: "boolean", value: false },
          { name: "key", key: "nullable" },
          { name: "value", type: "null", value: null },
          { name: "key", key: "arry" },
          { name: "startArray" },
          { name: "value", type: "string", value: "test" },
          { name: "endArray" },
          { name: "endObject" },
          { name: "endDocument" },
        ]
      },
      {
        name: "space and array",
        options: { skipDocument: true },
        input: [
          `       [    true   ]         `
        ],
        output: [
          { name: "startArray" },
          { name: "value", type: "boolean", value: true },
          { name: "endArray" },
        ]
      },
      {
        name: "space and object",
        options: { skipDocument: true },
        input: [
          `       {    "value": 1,   }         `
        ],
        output: [
          { name: "startObject" },
          { name: "key", key: "value" },
          { name: "value", type: "number", value: 1 },
          { name: "endObject" },
        ]
      },
      {
        name: "simple value number",
        options: { skipDocument: true },
        input: [
          `1`,
        ],
        output: [
          { name: "value", type: "number", value: 1 },
        ]
      },
      {
        name: "simple value string",
        options: { skipDocument: true },
        input: [
          `"hoge"`,
        ],
        output: [
          { name: "value", type: "string", value: "hoge" },
        ]
      },
      {
        name: "escaped value string",
        options: { skipDocument: true },
        input: [
          `"hoge\\"fuga"`,
        ],
        output: [
          { name: "value", type: "string", value: "hoge\"fuga" },
        ]
      },
      {
        name: "simple value boolean",
        options: { skipDocument: true },
        input: [
          `false`,
        ],
        output: [
          { name: "value", type: "boolean", value: false },
        ]
      },
      {
        name: "simple value null",
        options: { skipDocument: true },
        input: [
          `null`,
        ],
        output: [
          { name: "value", type: "null", value: null },
        ]
      },
      {
        name: "crlf array",
        input: [
          `\t
          [\r\n
            null
            ,



            null,

            null
          ]`
        ],
        output: [
          {
            kind: "json",
            name: "startDocument",
          },
          {
            name: "startArray",
          },
          {
            name: "value",
            type: "null",
            value: null,
          },
          {
            name: "value",
            type: "null",
            value: null,
          },
          {
            name: "value",
            type: "null",
            value: null,
          },
          {
            name: "endArray"
          },
          {
            name: "endDocument",
          },
        ]
      },
      {
        name: "crlf object",
        input: [
          `\t
          {\r\n
            "value1":null
            ,

            "value2"
            :
            null,

            "value3"

            :null
          }`
        ],
        output: [
          {
            kind: "json",
            name: "startDocument",
          },
          {
            name: "startObject",
          },
          {
            key: "value1",
            name: "key",
          },
          {
            name: "value",
            type: "null",
            value: null,
          },
          {
            key: "value2",
            name: "key",
          },
          {
            name: "value",
            type: "null",
            value: null,
          },
          {
            key: "value3",
            name: "key",
          },
          {
            name: "value",
            type: "null",
            value: null,
          },
          {
            name: "endObject"
          },
          {
            name: "endDocument",
          },
        ]
      },
      {
        name: "multipledocument",
        options: { multiple: true },
        input: [
          `1
          2`,
        ],
        output: [
          {
            kind: "json",
            name: "startDocument",
          },
          {
            name: "value",
            type: "number",
            value: 1,
          },
          {
            name: "endDocument",
          },
          {
            kind: "json",
            name: "startDocument",
          },
          {
            name: "value",
            type: "number",
            value: 2,
          },
          {
            name: "endDocument",
          },
        ]
      }
    ];
  it.each(entries)("$name", async ({ input, output, options }) => {
    const { writable, readable } = new JSONTextToSAJTransformStream(options);
    const writed = (async () => {
      const writer = writable.getWriter();
      for (const i of input) {
        for (const chunk of i.match(/.{1,10}/g) ?? [])
          await writer.write(chunk);
      }
      await writer.close();
    })();
    const readed = Array.fromAsync(readable);
    try {
      await expect(writed).resolves.toBeUndefined();
      await expect(readed).resolves.toEqual(output);
    } catch (e) {
      const e2 = readed.catch(v => v);
      if (e2 instanceof json.streams.JSONTextToSAJParserError) {
        console.dir(e2.cause);
      }
      throw e;
    }
  });
});

describe("error", (it) => {
  const entries: {
    name: string;
    options?: ConstructorParameters<typeof JSONTextToSAJTransformStream>[0];
    input: string[];
    output:
    Record<"read" | "write", {
      error: (string | RegExp | (new () => unknown) | Error | undefined)[];
    } | {
      result: unknown[] | undefined;
    }>;
  }[] = [
      {
        name: "parse error",
        input: [
          `
          {
          "hoge":
            "hoge"
            ,"fuga"
          }`
        ],
        output: {
          write: {
            error: [
              TypeError
            ],
          },
          read: {
            error: [
              json.streams.JSONTextToSAJParserError,
              `Expected colon after key but got: }`
            ]
          }
        }
      }, {
        name: "not support multiple in single",
        options: { multiple: false },
        input: [
          `
          "hoge"
          "fuga"
          `
        ],
        output: {
          write: {
            error: [
              TypeError
            ],
          },
          read: {
            error: [
              json.streams.JSONTextToSAJParserError,
              `is closed document`
            ]
          }
        }
      },
      {
        name: "invalid eol",
        input: [`
          [
          "fuga"
            `
        ],
        output: {
          write: {
            error: [
              json.streams.JSONTextToSAJParserError,
              `not complete syntax error. buffer:
          [
          "fuga"
            `,
            ],
          },
          read: {
            error: [
              json.streams.JSONTextToSAJParserError,
              `not complete syntax error. buffer:
          [
          "fuga"
            `,
            ]
          }
        }
      }
    ];
  it.each(entries)("$name", async ({ input, output: { read, write }, options }) => {
    const { readable, writable } = new JSONTextToSAJTransformStream(options);
    const writed = (async () => {
      const writer = writable.getWriter();
      for (const text of input)
        await writer.write(text);
      await writer.close();
    })();
    const readed = Array.fromAsync(readable);

    for (const [resultType, result] of [
      [read, readed],
      [write, writed],
    ] as const) {
      if ("error" in resultType) {
        for (const error of resultType.error)
          try {
            await expect(result).rejects.toThrowError(error);
          } finally {
            const error = await result.catch(v => v);
            console.dir(error);
          }
      } else {
        if (resultType.result === undefined)
          await expect(result).resolves.toBeUndefined();
        else
          await expect(result).resolves.toEqual(resultType.result);
      }
    }
  });
});
