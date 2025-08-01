import { describe, expect } from "vitest";
import { SAJEventInterface } from "./event-interface";
import { SAJToJSONTextTransformStream } from "./SAJToJSONTextTransformStream";

describe("pattern", (it) => {
  const entries: {
    name: string;
    input: SAJEventInterface[];
    output: string[];
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
          "{",
          `"num":`,
          "0",
          ",",
          `"str":`,
          `"value"`,
          ",",
          `"bool1":`,
          "true",
          ",",
          `"bool2":`,
          "false",
          ",",
          `"nullable":`,
          "null",
          ",",
          `"arry":`,
          "[",
          `"test"`,
          "]",
          "}",
        ]
      }
    ];
  it.each(entries)("$name", async ({ input, output }) => {
    const result = await (() => {
      const { readable, writable } = new SAJToJSONTextTransformStream();
      (async () => {
        const writer = writable.getWriter();
        for (const entry of input)
          await writer.write(entry);
        await writer.close();
      })();
      return Array.fromAsync(readable);
    })();
    expect(result).toEqual(output);
  })
})
