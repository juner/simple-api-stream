import { describe, expect } from "vitest";
import { KeySAJEventInterface, SAJEventInterface, ValueBooleanSAJEventInterface, ValueNullSAJEventInterface, ValueNumberSAJEventInterface, ValueStringSAJEventInterface } from "./event-interface";
import { SAJToJSONTextTransformStream, SAJToJSONTextTransformStreamError } from "./SAJToJSONTextTransformStream";

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
      }, {
        name: "mini",
        input: [
          { name: "startObject", type: "object" },
          { name: "key", key: "arry" },
          { name: "startArray", type: "array" },
          { name: "value", type: "string", value: "test" },
          { name: "endArray" },
          { name: "endObject" },
        ],
        output: [
          "{",
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
});

// ヘルパー：SAJ イベント列を流し込んで出力チャンクを集める
async function collectChunks(events: SAJEventInterface[]): Promise<string[]> {
  const stream = new SAJToJSONTextTransformStream();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  // 書き込みを並列で進めつつ読み出し
  (async () => {
    for (const evt of events) {
      await writer.write(evt);
    }
    await writer.close();
  })();
  const result: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result.push(value);
  }
  return result;
}

// ヘルパー：チャンク列をまとめて JSON.parse して戻り値を得る
async function parseFromEvents(events: SAJEventInterface[]): Promise<unknown> {
  const chunks = await collectChunks(events);
  return JSON.parse(chunks.join(""));
}

describe("SAJToJSONTextTransformStream - basic", (it) => {
  it("serializes an object with all primitive types", async () => {
    const events: SAJEventInterface[] = [
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
    ];
    const obj = await parseFromEvents(events);
    expect(obj).toEqual({
      num: 0,
      str: "value",
      bool1: true,
      bool2: false,
      nullable: null,
      arry: ["test"],
    });
  });

  it("handles nested object and array", async () => {
    const events: SAJEventInterface[] = [
      { name: "startObject", type: "object" },
      { name: "key", key: "a" },
      { name: "startArray", type: "array" },
      { name: "value", type: "number", value: 1 },
      { name: "value", type: "number", value: 2 },
      { name: "startArray", type: "array" },
      { name: "value", type: "string", value: "x" },
      { name: "endArray" },
      { name: "endArray" },
      { name: "endObject" },
    ];
    const obj = await parseFromEvents(events);
    expect(obj).toEqual({ a: [1, 2, ["x"]] });
  });

  it("serializes empty object and array", async () => {
    const events1: SAJEventInterface[] = [
      { name: "startObject", type: "object" },
      { name: "endObject" },
    ];
    const events2: SAJEventInterface[] = [
      { name: "startArray", type: "array" },
      { name: "endArray" },
    ];
    const o = await parseFromEvents(events1);
    const a = await parseFromEvents(events2);
    expect(o).toEqual({});
    expect(a).toEqual([]);
  });

  it("handles array of consecutive values with proper commas", async () => {
    const events: SAJEventInterface[] = [
      { name: "startArray", type: "array" },
      { name: "value", type: "number", value: 1 },
      { name: "value", type: "number", value: 2 },
      { name: "value", type: "number", value: 3 },
      { name: "endArray" },
    ];
    const arr = await parseFromEvents(events);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("handles key immediately followed by object (no extra comma)", async () => {
    const events: SAJEventInterface[] = [
      { name: "startObject", type: "object" },
      { name: "key", key: "nested" },
      { name: "startObject", type: "object" },
      { name: "key", key: "x" },
      { name: "value", type: "string", value: "y" },
      { name: "endObject" },
      { name: "endObject" },
    ];
    const obj = await parseFromEvents(events);
    expect(obj).toEqual({ nested: { x: "y" } });
  });

  it("handles key immediately followed by array (no extra comma)", async () => {
    const events: SAJEventInterface[] = [
      { name: "startObject", type: "object" },
      { name: "key", key: "list" },
      { name: "startArray", type: "array" },
      { name: "value", type: "boolean", value: false },
      { name: "endArray" },
      { name: "endObject" },
    ];
    const obj = await parseFromEvents(events);
    expect(obj).toEqual({ list: [false] });
  });
});

describe("SAJToJSONTextTransformStream - error handling", (it) => {
  it("throws on mismatched end (extra endObject)", async () => {
    const stream = new SAJToJSONTextTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // ここで余計な endObject を送るとエラーが投げられるはず
    const wait2 = (async () => {
      // 正常なオブジェクトのあとに余計な endObject を送る
      await writer.write({ name: "startObject", type: "object" });
      await writer.write({ name: "endObject" });
      await writer.write({ name: "endObject" } as any);
      await writer.close();
    })();
    const wait1 = (async () => {
      // 先に読み出して error を拾うパターンもあるので読んでおく
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    })();
    await expect(wait1).rejects.toThrowError(SAJToJSONTextTransformStreamError);
    await expect(wait2).rejects.toThrowError(TypeError);
  });

  it("throws if key appears outside object", async () => {
    const stream = new SAJToJSONTextTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    const wait1 = (async () => {
      await writer.write({ name: "key", key: "bad" } as any);
      await writer.close();
    })();
    const wait2 = (async () => {
      // drain to surface potential error from transform
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    })();
    await expect(wait1).rejects.toThrowError(Error);
    await expect(wait2).rejects.toThrowError(Error);
  });
});
