import type { CdataEvent, CommentEvent, DisplayingXMLEvent, DoctypeEvent, EndElementEvent, StartElementEvent, TextEvent, XMLDeclarationEvent } from "../event";

export interface SimpleSAXResolver {
  cdata(...args: ConstructorParameters<typeof CdataEvent>):void;
  comment(...args: ConstructorParameters<typeof CommentEvent>):void;
  displayingXML(...args: ConstructorParameters<typeof DisplayingXMLEvent>):void;
  doctype(...args: ConstructorParameters<typeof DoctypeEvent>):void;
  endElement(...args: ConstructorParameters<typeof EndElementEvent>):void;
  startElement(...args: ConstructorParameters<typeof StartElementEvent>):void;
  text(...args: ConstructorParameters<typeof TextEvent>):void;
  xmlDeclarationn(...args: ConstructorParameters<typeof XMLDeclarationEvent>):void;
}
