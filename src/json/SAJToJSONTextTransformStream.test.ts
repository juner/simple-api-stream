// SAJToJSONTextTransformStream.test.ts
import { describe, it, expect } from "vitest";
import type {
  SAJEventInterface,
} from "./event-interface";
import {
  SAJToJSONTextTransformStream,
  SAJToJSONTextTransformStreamError,
} from "./SAJToJSONTextTransformStream";

// ヘルパー：SAJ イベント列を流し込んで出力チャンクを集める（正常系用）
async function collectChunks(events: SAJEventInterface[]): Promise<string[]> {
  const stream = new SAJToJSONTextTransformStream();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const result: string[] = [];

  // 読み出しを並行で回しておく（書き込みがブロックしないように）
  const readPromise = (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result.push(value);
    }
  })();

  // 書き込み
  for (const evt of events) {
    await writer.write(evt);
  }
  await writer.close();

  // 読み出し完了を待つ
  await readPromise;

  return result;
}

// ヘルパー：チャンク列をまとめて JSON.parse して構造を取り出す
async function parseFromEvents(events: SAJEventInterface[]): Promise<unknown> {
  const chunks = await collectChunks(events);
  return JSON.parse(chunks.join(""));
}

describe("SAJToJSONTextTransformStream - valid inputs", () => {
  it("serializes an object with all primitive types", async () => {
    const events: SAJEventInterface[] = [
      { name: "startDocument", kind:"json" },
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
      { name: "startObject" },
      { name: "key", key: "a" },
      { name: "startArray" },
      { name: "value", type: "number", value: 1 },
      { name: "value", type: "number", value: 2 },
      { name: "startArray" },
      { name: "value", type: "string", value: "x" },
      { name: "endArray" },
      { name: "endArray" },
      { name: "endObject" },
    ];
    const obj = await parseFromEvents(events);
    expect(obj).toEqual({ a: [1, 2, ["x"]] });
  });

  it("serializes empty object and array", async () => {
    const events1: SAJEventInterface[] = [{ name: "startObject" }, { name: "endObject" }];
    const events2: SAJEventInterface[] = [{ name: "startArray" }, { name: "endArray" }];
    const o = await parseFromEvents(events1);
    const a = await parseFromEvents(events2);
    expect(o).toEqual({});
    expect(a).toEqual([]);
  });

  it("handles array of consecutive values with proper commas", async () => {
    const events: SAJEventInterface[] = [
      { name: "startArray" },
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
      { name: "startObject" },
      { name: "key", key: "nested" },
      { name: "startObject" },
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
      { name: "startObject" },
      { name: "key", key: "list" },
      { name: "startArray" },
      { name: "value", type: "boolean", value: false },
      { name: "endArray" },
      { name: "endObject" },
    ];
    const obj = await parseFromEvents(events);
    expect(obj).toEqual({ list: [false] });
  });
});

describe("SAJToJSONTextTransformStream - error handling", () => {
  it("throws SAJToJSONTextTransformStreamError on mismatched end (extra endObject)", async () => {
    const stream = new SAJToJSONTextTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    const readPromise = (async () => {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    })();

    const writePromise = (async () => {
      await writer.write({ name: "startObject" });
      await writer.write({ name: "endObject" });
      // ここで mismatched endObject を送る
      await writer.write({ name: "endObject" });
      await writer.close();
    })();

    await expect(readPromise).rejects.toThrowError(expect.any(SAJToJSONTextTransformStreamError));
    await expect(writePromise).rejects.toThrowError(expect.any(TypeError));
  });

  it("throws if key appears outside object", async () => {
    const stream = new SAJToJSONTextTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    const readPromise = (async () => {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    })();

    const writePromise = (async () => {
      await writer.write({ name: "key", key: "bad" });
      await writer.close();
    })();

    await expect(readPromise).rejects.toThrowError(expect.any(SAJToJSONTextTransformStreamError));
    await expect(writePromise).rejects.toThrowError(expect.any(TypeError));
  });
});
