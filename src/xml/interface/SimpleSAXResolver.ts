import type { CdataEvent, CommentEvent, XMLStylesheetDeclarationEvent, EndElementEvent, StartElementEvent, TextEvent, XMLDeclarationEvent, DoctypePublicEvent, DoctypeSimpleEvent, DoctypeSystemEvent, ProcessingInstructionEvent } from "../event";
export interface SimpleSAXResolver {
  cdata(...args: ConstructorParameters<typeof CdataEvent>): void;
  comment(...args: ConstructorParameters<typeof CommentEvent>): void;
  doctype(...args: ConstructorParameters<typeof DoctypePublicEvent | typeof DoctypeSimpleEvent| typeof DoctypeSystemEvent>): void;
  endElement(...args: ConstructorParameters<typeof EndElementEvent>): void;
  startElement(...args: ConstructorParameters<typeof StartElementEvent>): void;
  text(...args: ConstructorParameters<typeof TextEvent>): void;
  processingInstruction(...args: ConstructorParameters<typeof ProcessingInstructionEvent | typeof XMLDeclarationEvent | typeof XMLStylesheetDeclarationEvent>): void;

}
