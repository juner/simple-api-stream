import { describe, expect } from "vitest";
import type { json } from "..";
import { SAJToObjectTransform } from "..";

type SAJEventInterface = json.eventInterface.SAJEventInterface;
describe("pattern", (it) => {
  const entries: {
    name: string;
    input: SAJEventInterface[];
    output: unknown;
  }[] = [
      {
        name: "all type",
        input: [
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
        ],
        output: [
          {
            "num": 0, "str": "value", "bool1": true, "bool2": false, "nullable": null, "arry": [
              "test"
            ]
          },
        ]
      },
      {
        name: "simple value number",
        input: [
          { name: "value", type: "number", value: 1 },
        ],
        output: 1,
      },
      {
        name: "simple value string",
        input: [
          { name: "value", type: "string", value: "hoge" },
        ],
        output: "hoge"
      },
      {
        name: "simple value boolean",
        input: [
          { name: "value", type: "boolean", value: false },
        ],
        output: false,

      },
      {
        name: "simple value null",
        input: [
          { name: "value", type: "null", value: null },
        ],
        output: null,
      },
    ];
  it.each(entries)("$name", async ({ input, output }) => {
    const result = await (() => {
      const stream = new SAJToObjectTransform;
      (async () => {
        const writer = stream.writable.getWriter();
        for (const entry of input) {
          await writer.write(entry);
        }
      })();
      return stream.value();
    })();
    expect(result).toEqual(output);
  });
});
