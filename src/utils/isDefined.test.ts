import { describe } from "vitest";
import { assertIsDefined, isDefined } from ".";

describe.concurrent("assertIsDefined", (test) => {
  test("value is undefined: throw", ({ expect }) => {
    const value: string | undefined = undefined;
    expect(() => assertIsDefined(value), `value is undefined. required throw`)
      .toThrowError("Value is undefined");
  });
  test("value is null: throw", ({ expect }) => {
    const value: string | null = null;
    expect(() => assertIsDefined(value), `value is null. required throw`)
      .toThrowError("Value is undefined");
  });

  test("value is empty string: not throw", ({ expect }) => {
    const value: string | undefined = "";
    expect(assertIsDefined(value), `value is empty string. required no throw`)
      .toBeUndefined();
  });

  test("value is string: not throw", ({ expect }) => {
    const value: string | undefined = "hoge";
    expect(assertIsDefined(value), `value is string. required no throw`)
      .toBeUndefined();
  });
});

describe.concurrent("isDefined", (test) => {
  test("value is undefined: false", ({ expect }) => {
    const value: string | undefined = undefined;
    expect(isDefined(value), `value is undefined. required false`)
      .toBe(false);
  });
  test("value is null: false", ({ expect }) => {
    const value: string | null = null;
    expect(isDefined(value), `value is null. required false`)
      .toBe(false);
  });

  test("value is empty string: true", ({ expect }) => {
    const value: string | undefined = "";
    expect(isDefined(value), `value is empty string. required true`)
      .toBe(true);
  });

  test("value is string: not throw", ({ expect }) => {
    const value: string | undefined = "hoge";
    expect(isDefined(value), `value is string. required true`)
      .toBe(true);
  });
});
