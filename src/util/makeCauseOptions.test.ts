import {describe} from "vitest";
// このメソッドは公開しないので直接参照する
import { makeCauseOptions } from "./makeCauseOptions";

describe("pattern", (it) => {
  it.concurrent("empty", ({expect}) => {
    const result = makeCauseOptions(undefined);
    expect(result).toBeUndefined();
  });
  it.concurrent("not have args", ({expect}) => {
    const result = makeCauseOptions();
    expect(result).toBeUndefined();
  });
});
