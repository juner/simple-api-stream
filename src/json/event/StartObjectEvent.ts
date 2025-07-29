import { TypeEvent } from "./TypeEvent";

export const SAJ_START_OBJECT_EVENT_TYPE = "startObject";
export class StartObjectEvent extends TypeEvent<typeof SAJ_START_OBJECT_EVENT_TYPE, "object"> {
  constructor() {
    super(SAJ_START_OBJECT_EVENT_TYPE, "object");
  }
}



