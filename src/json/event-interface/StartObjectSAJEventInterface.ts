import type { SAJ_START_OBJECT_EVENT_TYPE } from "../event/StartObjectEvent";
import type { TypeSAJEventInterface } from "./TypeSAJEventInterface";

export interface StartObjectSAJEventInterface extends TypeSAJEventInterface<"object"> {
  name: typeof SAJ_START_OBJECT_EVENT_TYPE;
  type: "object";
}
