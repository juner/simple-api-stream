import { describe, expect } from "vitest";
import type { json } from "..";
import { JSONTextToSAJTransformStream } from "..";

type SAJEventInterface = json.eventInterface.SAJEventInterface;
describe("pattern", (it) => {
  const entries: {
    name: string;
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
          { name: "startObject", type: "object" },
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
          { name: "startArray", type: "array" },
          { name: "value", type: "string", value: "test" },
          { name: "endArray" },
          { name: "endObject" },
        ]
      },
      {
        name: "space and array",
        input: [
          `       [    true   ]         `
        ],
        output: [
          { name: "startArray", type: "array" },
          { name: "value", type: "boolean", value: true },
          { name: "endArray" },
        ]
      },
      {
        name: "space and object",
        input: [
          `       {    "value": 1,   }         `
        ],
        output: [
          { name: "startObject", type: "object" },
          { name: "key", key: "value" },
          { name: "value", type: "number", value: 1 },
          { name: "endObject" },
        ]
      },
      {
        name: "simple value number",
        input: [
          `1`,
        ],
        output: [
          { name: "value", type: "number", value: 1 },
        ]
      },
      {
        name: "simple value string",
        input: [
          `"hoge"`,
        ],
        output: [
          { name: "value", type: "string", value: "hoge" },
        ]
      },
      {
        name: "escaped value string",
        input: [
          `"hoge\\"fuga"`,
        ],
        output: [
          { name: "value", type: "string", value: "hoge\"fuga" },
        ]
      },
      {
        name: "simple value boolean",
        input: [
          `false`,
        ],
        output: [
          { name: "value", type: "boolean", value: false },
        ]
      },
      {
        name: "simple value null",
        input: [
          `null`,
        ],
        output: [
          { name: "value", type: "null", value: null },
        ]
      },
    ];
  it.each(entries)("$name", async ({ input, output }) => {
    const result = await (() => {
      const {writable, readable} = new JSONTextToSAJTransformStream();
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
    expect(result).toEqual(output);
  });
});
