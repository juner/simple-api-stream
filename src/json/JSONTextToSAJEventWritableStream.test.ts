import { describe, expect, vi } from "vitest";
import type { json } from "..";
import { JSONTextToSAJEventWritableStream } from "..";

type SAJEventInterface = json.eventInterfaces.SAJEventInterface;
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
        ]
      },
      {
        name: "space and array",
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
        name: "simple value number (1)",
        input: [
          `1`,
        ],
        output: [
          { name: "value", type: "number", value: 1 },
        ]
      },
      {
        name: "simple value number (0)",
        input: [
          `0`,
        ],
        output: [
          { name: "value", type: "number", value: 0 },
        ]
      },
      {
        name: "simple value number (-1)",
        input: [
          `-1`,
        ],
        output: [
          { name: "value", type: "number", value: -1 },
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
        name: "simple value false",
        input: [
          `false`,
        ],
        output: [
          { name: "value", type: "boolean", value: false },
        ]
      },
      {
        name: "simple value true",
        input: [
          `true`,
        ],
        output: [
          { name: "value", type: "boolean", value: true },
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
      }
    ];
  it.each(entries)("$name", async ({ input, output }) => {
    const result = await (() => {
      const { resolve, reject, promise } = Promise.withResolvers<SAJEventInterface[]>();

      const result: SAJEventInterface[] = [];
      const stream = new JSONTextToSAJEventWritableStream({
        onEndArray(arg) { result.push(arg); },
        onEndObject(arg) { result.push(arg); },
        onKey(arg) { result.push(arg); },
        onStartArray(arg) { result.push(arg); },
        onStartObject(arg) { result.push(arg); },
        onValue(arg) { result.push(arg); },
        onError(arg) { reject(arg); },
      });
      (async () => {
        const writer = stream.getWriter();
        for (const i of input) {
          for (const chunk of i.match(/.{1,10}/g) ?? [])
            await writer.write(chunk);
        }
        await writer.close();
        resolve(result);
      })();
      return promise;
    })();
    expect(result).toEqual(output);
  });
});
describe("error onError", (it) => {
  it.concurrent("", async ({expect}) => {
    const handler: Partial<json.interfaces.SAJHandler> = {
      onError: vi.fn(),
    };
    const stream = new JSONTextToSAJEventWritableStream(handler);
    stream.abort(new Error("error"));
    // onError 実行タイミングは queueMicrotask 後
    await (null as unknown as Promise<void>);
    expect(handler.onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
