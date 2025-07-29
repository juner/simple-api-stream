import type { ValueSAJEventInterface } from "../event-interface";
import { TypeEvent } from "./TypeEvent";

type ValueType = "number"|"string"|"null"|"boolean";
type ValueDictionary = {
  "number": number,
  "string": string,
  "null": null,
  "boolean": boolean,
}
export const SAJ_VALUE_EVENT_TYPE = "value";
export class ValueEvent<VT extends ValueType> extends TypeEvent<typeof SAJ_VALUE_EVENT_TYPE, VT> implements ValueSAJEventInterface<VT> {
  value: ValueDictionary[VT];
  constructor(type: VT, value: ValueDictionary[VT]) {
    super(SAJ_VALUE_EVENT_TYPE, type);
    this.value = value;
  }
}


