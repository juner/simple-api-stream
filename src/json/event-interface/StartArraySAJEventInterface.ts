import type { SAJ_START_ARRAY_EVENT_TYPE } from "../event/StartArrayEvent";
import type { TypeSAJEventInterface } from "./TypeSAJEventInterface";

export interface StartArraySAJEventInterface extends TypeSAJEventInterface<"array"> {
  name: typeof SAJ_START_ARRAY_EVENT_TYPE;
  type: "array";
}
