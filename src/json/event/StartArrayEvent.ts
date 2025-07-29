import type { StartArraySAJEventInterface } from "../event-interface";
import { TypeEvent } from "./TypeEvent";

export const SAJ_START_ARRAY_EVENT_TYPE = "startArray";
export class StartArrayEvent extends TypeEvent<typeof SAJ_START_ARRAY_EVENT_TYPE, "array"> implements StartArraySAJEventInterface {
  constructor() {
    super(SAJ_START_ARRAY_EVENT_TYPE, "array");
  }
}
