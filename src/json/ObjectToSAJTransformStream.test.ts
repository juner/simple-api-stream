import { describe, expect, test } from "vitest";
import type { SAJEventInterface } from "./event-interface";
import { ObjectToSAJTransformStream, json } from "..";
const ObjectToSAJTransformStreamError = json.streams.ObjectToSAJTransformStreamError;

describe.concurrent("pattern", async (test) => {
  const entries: {
    name: string;
    options?: ConstructorParameters<typeof ObjectToSAJTransformStream>[0];
    input: unknown[];
    output: SAJEventInterface[];
  }[] = [
      {
        name: "empty",
        input: [],
        output: [],
      },
      {
        name: "all type",
        input:
          [{
            num: 0,
            str: "value",
            bool1: true,
            bool2: false,
            nullable: null,
            arry: [
              "test"
            ]
          }],
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
      }, {
        name: "iterator",
        input: [
          (function* () {
            yield 1;
            yield 2;
            yield 3;
          })(),
        ],
        output: [
          { name: "startDocument", kind: "json" },
          { name: "startArray" },
          { name: "value", type: "number", value: 1 },
          { name: "value", type: "number", value: 2 },
          { name: "value", type: "number", value: 3 },
          { name: "endArray" },
          { name: "endDocument" },
        ]
      }, {
        name: "async iterator",
        input: [
          (async function* () {
            await (null as unknown as Promise<void>);
            yield 1;
            yield 2;
            await (null as unknown as Promise<void>);
            yield 3;
          })(),
        ],
        output: [
          { name: "startDocument", kind: "json" },
          { name: "startArray" },
          { name: "value", type: "number", value: 1 },
          { name: "value", type: "number", value: 2 },
          { name: "value", type: "number", value: 3 },
          { name: "endArray" },
          { name: "endDocument" },
        ]
      },
      {
        name: "symbol value",
        input: [
          {
            value: Symbol.toStringTag,
          },
          [
            Symbol.toStringTag,
          ],
        ],
        output: [
          { name: "startDocument", kind: "json" },
          { name: "startObject" },
          { name: "endObject" },
          { name: "endDocument" },
          { name: "startDocument", kind: "json" },
          { name: "startArray" },
          { name: "endArray" },
          { name: "endDocument" },
        ]
      },
      {
        name: "not support to null",
        options: {
          unSupported: ObjectToSAJTransformStream.unSupoortedToNull,
        },
        input: [
          {
            value: () => "hello",
          }
        ],
        output: [
          { name: "startDocument", kind: "json" },
          { name: "startObject" },
          { name: "key", key: "value" },
          { name: "value", type: "null", value: null },
          { name: "endObject" },
          { name: "endDocument" },
        ]
      }
    ];
  test.each(entries)("$name", async ({ options, input, output }) => {
    const { readable, writable } = new ObjectToSAJTransformStream(options);
    const readed = Array.fromAsync(readable);
    const writed = (async () => {
      const writer = writable.getWriter();
      for (const item of input)
        await writer.write(item);
      await writer.close();
    })();
    await expect(writed).resolves.toBeUndefined();
    await expect(readed).resolves.toEqual(output);
  });
});

test("error inner exception", async ({ expect }) => {
  const { readable, writable } = new ObjectToSAJTransformStream({
    unSupported: "null",
  });
  const readed = Array.fromAsync(readable);
  const writed = (async (input) => {
    const writer = writable.getWriter();
    await writer.write(input);
    await writer.close();
  })((async function* () {
    await (null as unknown as Promise<void>);
    yield 1;
    yield 0n;
    throw new Error("iterator user error");
  })());
  await expect(readed).rejects.toThrowError("iterator user error");
  await expect(writed).rejects.toThrowError("iterator user error");
});
test("notsupport to custom skip", async ({ expect }) => {
  const { readable, writable } = new ObjectToSAJTransformStream({
    unSupported: ({value:_, skip}) => {
      return skip;
    }
  });
  const readed = Array.fromAsync(readable);
  const writed = (async (input) => {
    const writer = writable.getWriter();
    await writer.write(input);
    await writer.close();
  })({
    value: 1n,
  });
  await expect(readed).resolves.toEqual([
    { name: "startDocument", kind: "json"},
    { name: "startObject" },
    { name: "endObject" },
    { name: "endDocument"}
  ]);
  await expect(writed).resolves.toBeUndefined();
});
test("notsupport to custom error", async ({ expect }) => {
  const { readable, writable } = new ObjectToSAJTransformStream({
    unSupported: () => {
      throw new Error("custom error");
    }
  });
  const readed = Array.fromAsync(readable);
  const writed = (async (input) => {
    const writer = writable.getWriter();
    await writer.write(input);
    await writer.close();
  })({
    value: 1n,
  });
  await expect(readed).rejects.toThrowError(ObjectToSAJTransformStreamError);
  await expect(readed).rejects.toThrowError("custom error");
  await expect(writed).rejects.toThrowError(ObjectToSAJTransformStreamError);
  await expect(writed).rejects.toThrowError("custom error");
});

test("notsupport to custom value", async ({ expect }) => {
  const { readable, writable } = new ObjectToSAJTransformStream({
    unSupported: () => {
      return [0];
    }
  });
  const readed = Array.fromAsync(readable);
  const writed = (async (input) => {
    const writer = writable.getWriter();
    await writer.write(input);
    await writer.close();
  })({
    value: 1n,
  });
  await expect(readed).resolves.toEqual([
    { name: "startDocument", kind: "json"},
    { name: "startObject" },
    { name: "key", key: "value" },
    { name: "startArray"},
    { name: "value", type: "number", value: 0},
    { name: "endArray" },
    { name: "endObject" },
    { name: "endDocument"}
  ]);
  await expect(writed).resolves.toBeUndefined();
});

test("notsupport to error", async ({ expect }) => {
  const { readable, writable } = new ObjectToSAJTransformStream({
    unSupported: "error",
  });
  const readed = Array.fromAsync(readable);
  const writed = (async (input) => {
    const writer = writable.getWriter();
    await writer.write(input);
    await writer.close();
  })({
    value: 1n,
  });
  await expect(readed).rejects.toThrowError(ObjectToSAJTransformStreamError);
  await expect(readed).rejects.toThrowError("not support value 1");
  await expect(writed).rejects.toThrowError(ObjectToSAJTransformStreamError);
  await expect(writed).rejects.toThrowError("not support value 1");
});

describe.concurrent("status", (it) => {
  const entries: {
    name: string;
    options?: ConstructorParameters<typeof ObjectToSAJTransformStream>[0];
    status: {
      makeDocument: InstanceType<typeof ObjectToSAJTransformStream>["status"]["makeDocument"];
      unSupported: InstanceType<typeof ObjectToSAJTransformStream>["status"]["unSupported"][0];
    };
  }[] = [
      {
        name: "default",
        status: {
          makeDocument: true,
          unSupported: "ignore",
        }
      },
      {
        name: "makeDocument false",
        options: { makeDocument: false },
        status: {
          makeDocument: false,
          unSupported: "ignore",
        },
      },
      {
        name: "unSupported ignore",
        options: { unSupported: "ignore" },
        status: {
          makeDocument: true,
          unSupported: "ignore",
        },
      },
      {
        name: "unSupported error",
        options: { unSupported: "error" },
        status: {
          makeDocument: true,
          unSupported: "error",
        },
      },
      {
        name: "unSupported null",
        options: { unSupported: "null" },
        status: {
          makeDocument: true,
          unSupported: "null",
        },
      },
      {
        name: "unSupported custom",
        options: { unSupported: ({ value: _, skip }) => { return skip; } },
        status: {
          makeDocument: true,
          unSupported: "custom",
        },
      }
    ];
  it.each(entries)("$name", ({ options, status }) => {
    const stream = new ObjectToSAJTransformStream(options);
    const status_ = stream.status;
    expect(status_.makeDocument).toEqual(status.makeDocument);
    expect(status_.unSupported[0]).toEqual(status.unSupported);
  });
});
