export interface TypeSAJEventInterface<ValueType extends "number" | "string" | "null" | "array" | "object" | "boolean"> {
  type: ValueType
}
