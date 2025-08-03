import type { StartObjectSAJEventInterface } from "../event-interface";
import { SAJEvent } from "./SAJEvent";

export const SAJ_START_OBJECT_EVENT_TYPE = "startObject";
export class StartObjectEvent extends SAJEvent<typeof SAJ_START_OBJECT_EVENT_TYPE> implements StartObjectSAJEventInterface{
  constructor() {
    super(SAJ_START_OBJECT_EVENT_TYPE);
  }
}



