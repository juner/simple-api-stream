import type { EndArraySAJEventInterface } from "../event-interface";
import { SAJEvent } from "./SAJEvent";


export const SAJ_END_ARRAY_EVENT_TYPE = "endArray";
export class EndArrayEvent extends SAJEvent<typeof SAJ_END_ARRAY_EVENT_TYPE> implements EndArraySAJEventInterface{
  constructor() {
    super(SAJ_END_ARRAY_EVENT_TYPE);
  }
}
