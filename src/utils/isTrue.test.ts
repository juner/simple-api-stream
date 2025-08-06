import { describe } from "vitest";
import { assertIsTrue, isTrue } from ".";

describe.concurrent("assertIsTrue", (test) => {
  test("parameter true", ({expect}) => {
    const value = true;
    expect(assertIsTrue(value))
      .toBeUndefined();
  });
  test("parameter false and message", ({expect}) => {
    const value = false;
    expect(() => assertIsTrue(value, "assert value is false throw"))
      .toThrowError("assert value is false throw");
  });
  test("parameter false", ({expect}) => {
    const value = false;
    expect(() => assertIsTrue(value))
      .toThrowError("assert is false");
  });
});


describe.concurrent("isTrue", (test) => {
  test("parameter true", ({expect}) => {
    const value = true;
    expect(isTrue(value))
      .toBe(true);
  });
  test("parameter false", ({expect}) => {
    const value = false;
    expect(isTrue(value))
      .toBe(false);
  });
});
