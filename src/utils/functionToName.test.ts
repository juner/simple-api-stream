import { describe } from "vitest";
import { functionToName } from "./functionToName";

describe.concurrent("functionToName", (test) => {
  test("value1 function name is value", ({ expect }) => {
    const value1 = () => undefined;
    expect(functionToName(value1), `value1 function name is value1`)
      .toEqual("value1");
  });
  test("value function name is value", ({ expect }) => {
    function value2() {}
    expect(functionToName(value2), `value2 function name is value2`)
      .toEqual("value2");
  });
  test("private #func function name is func", ({expect}) => {
    class Class {
      static #func() {

      }
      static getFunc() {
        return this.#func;
      }
    }
    const value3 = Class.getFunc();
    expect(functionToName(value3, "#"), `value3 function name is func`)
      .toEqual("func");

  });
});
