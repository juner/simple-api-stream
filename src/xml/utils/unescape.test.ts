import { describe } from "vitest";
import { unescape } from ".";

describe.concurrent("unescape", (test) => {
  test("null", ({expect}) => {
    const value = null;
    expect(unescape(value)).toEqual("");
  });
  test("undefined", ({expect}) => {
    const value = undefined;
    expect(unescape(value)).toEqual("");
  });
  test("empty", ({expect}) => {
    const value = "";
    expect(unescape(value)).toEqual("");
  });
  test("recorized: &amp; -> &", ({expect}) => {
    const value = "&amp;";
    expect(unescape(value)).toEqual("&");
  });
  test("x10: &#8482; -> ™", ({expect}) => {
    const value = "&#8482;";
    expect(unescape(value)).toEqual("™");
  });
  test("x16: &#x21; -> !", ({expect}) => {
    const value = "&#x21;";
    expect(unescape(value)).toEqual("!");
  });
  test("not recorized: &hoge; -> &hoge;", ({expect}) => {
    const value = "&hoge;";
    expect(unescape(value)).toEqual("&hoge;");
  });
});
