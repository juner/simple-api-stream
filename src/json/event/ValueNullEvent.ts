import type { ValueNullSAJEventInterface } from "../event-interface";
import { ValueEvent } from "./ValueEvent";

export class ValueNullEvent extends ValueEvent<"null"> implements ValueNullSAJEventInterface {
  constructor(type: "null") {
    super(type, null);
  }
}
