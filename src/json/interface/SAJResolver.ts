import { EndArrayEvent, EndDocumentEvent, EndObjectEvent, KeyEvent, StartArrayEvent, StartDocumentEvent, StartObjectEvent, ValueEvent } from "../event";

export interface SAJResolver {
  startObject(...args: ConstructorParameters<typeof StartObjectEvent>): void
  endObject(...args: ConstructorParameters<typeof EndObjectEvent>): void
  startArray(...args: ConstructorParameters<typeof StartArrayEvent>): void
  endArray(...args: ConstructorParameters<typeof EndArrayEvent>): void
  key(...args: ConstructorParameters<typeof KeyEvent>): void
  value<T extends "string" | "number" | "null" | "boolean">(...args: ConstructorParameters<typeof ValueEvent<T>>): void
  startDocument(...args: ConstructorParameters<typeof StartDocumentEvent>): void
  endDocument(...args: ConstructorParameters<typeof EndDocumentEvent>): void
}
