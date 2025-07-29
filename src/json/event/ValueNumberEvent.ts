import type { ValueNumberSAJEventInterface } from "../event-interface";
import { ValueEvent } from "./ValueEvent";

export class ValueNumberEvent extends ValueEvent<"number"> implements ValueNumberSAJEventInterface {
  constructor(type: "number", value: number) {
    super(type, value);
  }
}
