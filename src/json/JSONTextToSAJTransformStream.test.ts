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
          { name: "startDocument" },
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
        options: {skipDocument: true},
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
    ];
  it.each(entries)("$name", async ({ input, output, options }) => {
    let result: json.eventInterface.SAJEventInterface[];
    try {
      result = await (() => {
        const { writable, readable } = new JSONTextToSAJTransformStream(options);
        (async () => {
          const writer = writable.getWriter();
          for (const i of input) {
            for (const chunk of i.match(/.{1,10}/g) ?? [])
              await writer.write(chunk);
          }
          await writer.close();
        })();
        return Array.fromAsync(readable);
      })();
    } catch (e: unknown) {
      if (e instanceof json.streams.JSONTextToSAJParserError) {
        console.dir(e.cause);
      }
      throw e;
    }
    expect(result).toEqual(output);
  });
});
