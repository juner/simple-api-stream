import type { ValueBooleanSAJEventInterface } from "../event-interface";
import { ValueEvent } from "./ValueEvent";


export class ValueBooleanEvent extends ValueEvent<"boolean"> implements ValueBooleanSAJEventInterface {
  constructor(type: "boolean", value: boolean) {
    super(type, value);
  }
}
