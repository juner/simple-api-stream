import { SAJEvent } from "./SAJEvent";
import type { KeySAJEventInterface } from "../event-interface";

export const SAJ_KEY_EVENT_TYPE = "endArray";
export class KeyEvent extends SAJEvent<typeof SAJ_KEY_EVENT_TYPE> implements KeySAJEventInterface {
  key: string;
  constructor(key: string) {
    super(SAJ_KEY_EVENT_TYPE);
    this.key = key;
  }
}
