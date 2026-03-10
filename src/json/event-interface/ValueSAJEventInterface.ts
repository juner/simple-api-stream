import type { SAJ_VALUE_EVENT_TYPE } from "../event";
import type { TypeSAJEventInterface } from "./TypeSAJEventInterface";
type ValueType = "number" | "string" | "null" | "boolean";
type ValueDictionary = {
  number: number
  string: string
  null: null
  boolean: boolean
};
export interface ValueSAJEventInterface<VT extends ValueType> extends TypeSAJEventInterface<VT> {
  name: typeof SAJ_VALUE_EVENT_TYPE
  value: ValueDictionary[VT]
}
