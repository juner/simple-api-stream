import { describe, expect } from "vitest";
import { SAJEventInterface } from "./event-interface";
import { JSONTextToSAJEventWritableStream } from ".";

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
          `"bool1": true, "bool2": false, "arry": [
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
          { name: "key", key: "arry" },
          { name: "startArray", type: "array" },
          { name: "value", type: "string", value: "test" },
          { name: "endArray" },
          { name: "endObject" },
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
      promise.catch((error) => {
        console.dir(result, 5);
        console.dir(error, 5);
      });
      return promise;
    })();
    expect(result).toEqual(output);
  });
});
