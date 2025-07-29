import { SAJEvent } from "./SAJEvent";

export const SAJ_END_OBJECT_EVENT_TYPE = "endObject";
export class EndObjectEvent extends SAJEvent<typeof SAJ_END_OBJECT_EVENT_TYPE>{
  constructor() {
    super(SAJ_END_OBJECT_EVENT_TYPE);
  }
}
