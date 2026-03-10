import type { StartArraySAJEventInterface } from "../event-interface";
import { SAJEvent } from "./SAJEvent";

export const SAJ_START_ARRAY_EVENT_TYPE = "startArray";
export class StartArrayEvent extends SAJEvent<typeof SAJ_START_ARRAY_EVENT_TYPE> implements StartArraySAJEventInterface {
  constructor() {
    super(SAJ_START_ARRAY_EVENT_TYPE);
  }
}
