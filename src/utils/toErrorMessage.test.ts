import { describe } from "vitest";
import { toErrorMessage } from "./toErrorMessage";

describe.concurrent("toErrorMessage", (test) => {
  test("string", ({ expect }) => {
    const message = "message1";
    expect(toErrorMessage(message)).toEqual({
      message: "message1",
    });
  });
  test("Error", ({ expect }) => {
    const message = new Error("message2");
    expect(toErrorMessage(message)).toEqual({
      message: "message2",
      options: { cause: message },
    });
  });
  test("unknown", ({ expect }) => {
    const message: unknown = {
      toString: () => "message3",
    };
    expect(toErrorMessage(message)).toEqual({
      message: "message3",
      options: { cause: message },
    });
  });
});
