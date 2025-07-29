import type { ValueStringSAJEventInterface } from "../event-interface";
import { ValueEvent } from "./ValueEvent";

export class ValueStringEvent extends ValueEvent<"string"> implements ValueStringSAJEventInterface {
  constructor(type: "string", value: string) {
    super(type, value);
  }
}
