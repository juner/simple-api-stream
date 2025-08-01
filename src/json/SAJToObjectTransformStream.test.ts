import { describe, expect,test } from "vitest";
import type { json } from "..";
import { SAJToObjectTransformStream } from "..";
import { SAJToObjectTransformStreamError, SAJToObjectTransformStreamOptions } from "./SAJToObjectTransformStream";

type SAJEventInterface = json.eventInterface.SAJEventInterface;

test("single error", async ({expect}) => {
  const {readable, writable} = new SAJToObjectTransformStream();
  const wait2 = (async () => {
    const writer = writable.getWriter();
    await writer.write({name: "value", type:"null", value: null});
    await writer.write({name: "value", type: "string", value: "hoge"});
    await writer.close();
  })();
  const wait = Array.fromAsync(readable);
  await expect(wait).rejects.toThrowError(expect.any(SAJToObjectTransformStreamError));
  await expect(wait2).rejects.toThrowError(expect.any(TypeError));
});

describe("pattern", (it) => {
  const entries: {
    name: string;
    options?: Partial<SAJToObjectTransformStreamOptions>;
    input: SAJEventInterface[];
    output: unknown[];
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
          }
        ]
      },
      {
        name: "simple value number",
        input: [
          { name: "value", type: "number", value: 1 },
        ],
        output: [1],
      },
      {
        name: "simple value string",
        input: [
          { name: "value", type: "string", value: "hoge" },
        ],
        output: ["hoge"],
      },
      {
        name: "simple value boolean",
        input: [
          { name: "value", type: "boolean", value: false },
        ],
        output: [false],

      },
      {
        name: "simple value null",
        input: [
          { name: "value", type: "null", value: null },
        ],
        output: [null],
      },
      {
        name: "multiple test",
        options: { multiple: true },
        input: [
          { name: "value", type: "boolean", value: true },
          { name: "value", type: "boolean", value: false },
        ],
        output: [
          true,
          false,
        ]
      },
    ];
  it.each(entries)("$name", async ({ input, output, options }) => {
    const result = await (() => {
      const {readable, writable} = new SAJToObjectTransformStream(options);
      (async () => {
        const writer = writable.getWriter();
        for (const entry of input) {
          await writer.write(entry);
        }
        await writer.close();
      })();
      return Array.fromAsync(readable);
    })();
    expect(result).toEqual(output);
  });
});
