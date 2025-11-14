import { describe, expect, test } from "vitest";
import type { json } from "..";
import { SAJToObjectTransformStream } from "..";
import { SAJToObjectTransformStreamError, SAJToObjectTransformStreamOptions } from "./SAJToObjectTransformStream";

type SAJEventInterface = json.eventInterfaces.SAJEventInterface;

test("single error", async ({ expect }) => {
  const { readable, writable, status } = new SAJToObjectTransformStream();
  const wait2 = (async () => {
    const writer = writable.getWriter();
    await writer.write({ name: "value", type: "null", value: null });
    await writer.write({ name: "value", type: "string", value: "hoge" });
    await writer.close();
  })();
  const wait = Array.fromAsync(readable);
  expect(status).toEqual({
    current: undefined,
    stackedList: [],
    state: "startEntry",
  });
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
        ],
        output: [
          {
            num: 0, str: "value", bool1: true, bool2: false, nullable: null, arry: [
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
      {
        name: "prototype",
        input: [
          { name: "startObject" },
          { name: "key", key: "prototype" },
          { name: "value", type: "string", value: "hoge" },
          { name: "endObject" },
        ],
        output: [
          { prototype: "hoge" }
        ]
      },
      {
        name: "__proto__",
        input: [
          { name: "startObject" },
          { name: "key", key: "__proto__" },
          { name: "value", type: "string", value: "hoge" },
          { name: "endObject" },
        ],
        output: [
          { ["__proto__"]: "hoge" }
        ]
      },
      {
        name: "array in object",
        input: [
          { name: "startArray" },
          { name: "startObject" },
          { name: "key", key: "value" },
          { name: "value", type: "string", value: "fuga" },
          { name: "endObject" },
          { name: "endArray" },
        ],
        output: [
          [
            {
              value: "fuga"
            }
          ]
        ]
      },
      {
        name: "object in array",
        input: [
          { name: "startObject" },
          { name: "key", key: "value" },
          { name: "startArray" },
          { name: "value", type: "number", value: 100 },
          { name: "endArray" },
          { name: "endObject" }
        ],
        output: [
          {
            value: [100]
          }
        ]
      },
      {
        name: "array in array",
        input: [
          { name: "startArray" },
          { name: "startArray" },
          { name: "value", type: "string", value: "fuga" },
          { name: "endArray" },
          { name: "endArray" },
        ],
        output: [
          [
            [
              "fuga",
            ]
          ]
        ]
      },
      {
        name: "object in object",
        input: [
          { name: "startObject" },
          { name: "key", key: "value" },
          { name: "startObject" },
          { name: "key", key: "value2" },
          { name: "value", type: "number", value: 100 },
          { name: "endObject" },
          { name: "endObject" }
        ],
        output: [
          {
            value: {
              value2: 100,
            }
          }
        ]
      },
    ];
  it.each(entries)("$name", async ({ input, output, options }) => {
    const result = await (() => {
      const { readable, writable } = new SAJToObjectTransformStream(options);
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

describe("error pattern", (it) => {
  const entries: {
    name: string;
    options?: Partial<SAJToObjectTransformStreamOptions>;
    input: SAJEventInterface[];
    output:
    Record<"read" | "write", {
      error: (string | RegExp | (new (...args: (ConstructorParameters<typeof SAJToObjectTransformStreamError>)) => unknown) | Error | undefined)[];
    } | {
      result: unknown[] | undefined;
    }>;
  }[] = [
      {
        name: "Incomplete JSON structure",
        input: [
          { name: "startArray" },
        ],
        output: {
          read: {
            error: [
              "Incomplete JSON structure",
              SAJToObjectTransformStreamError,
            ]
          },
          write: {
            error: [
              "Incomplete JSON structure",
              SAJToObjectTransformStreamError,
            ]
          }
        }
      },
      {
        name: "Unexpected endObject in array",
        input: [
          { name: "startArray" },
          { name: "endObject" },
        ],
        output: {
          read: {
            error: [
              "Unexpected endObject in array",
              SAJToObjectTransformStreamError,
            ]
          },
          write: {
            error: [
              "Invalid state: WritableStream is closed",
              TypeError,
            ]
          }
        }
      },
      {
        name: "Unexpected endObject after key",
        input: [
          { name: "startObject" },
          { name: "key", key: "value" },
          { name: "endObject" }
        ],
        output: {
          read: {
            error: [
              "Unexpected endObject after key",
              SAJToObjectTransformStreamError,
            ]
          },
          write: {
            error: [
              "Invalid state: WritableStream is closed",
              TypeError,
            ]
          }
        }
      },
      {
        name: "Unexpected endArray at root",
        input: [
          { name: "endArray" },
        ],
        output: {
          read: {
            error: [
              "Unexpected endArray at root",
              SAJToObjectTransformStreamError,
            ]
          },
          write: {
            error: [
              "Invalid state: WritableStream is closed",
              TypeError,
            ]
          }
        }
      },
      {
        name: "Unexpected startArray in object",
        input: [
          { name: "startObject" },
          { name: "startArray" },
        ],
        output: {
          read: {
            error: [
              "Unexpected startArray in object",
              SAJToObjectTransformStreamError,
            ]
          },
          write: {
            error: [
              "Invalid state: WritableStream is closed",
              TypeError,
            ]
          }
        }
      }
    ];
  it.each(entries)("$name", async ({ input, output: { read, write }, options }) => {
    const [readed, writed] = (() => {
      const { readable, writable } = new SAJToObjectTransformStream(options);
      const write = (async () => {
        const writer = writable.getWriter();
        for (const entry of input) {
          await writer.write(entry);
        }
        await writer.close();
      })();
      const read = Array.fromAsync(readable);
      return [read, write];
    })();
    for (const [name, resultType, result] of [
      ["read", read, readed],
      ["write", write, writed],
    ] as const)
      if ("error" in resultType) {
        for (const error of resultType.error)
          await expect(result, `${name} throw`).rejects.toThrowError(error);

      } else {
        if (resultType.result === undefined)
          await expect(result, `${name} result`).resolves.toBeUndefined();
        else
          await expect(result, `${name} result`).resolves.toEqual(resultType.result);
      }
  });
});
