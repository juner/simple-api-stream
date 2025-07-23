import type {
  EndElementSAXEventInterface,
  StartElementSAXEventInterface,
  TextSAXEventInterface,
  DtdSAXEventInterface,
  CdataSAXEventInterface,
  CommentSAXEventInterface,
  DisplayingXMLEventInterface,
  XMLdeclarationSAXEventInterface,
} from "../event-interface";

export interface SimpleSAXHandler {
  onDtd?: (arg: DtdSAXEventInterface) => void;
  onStartElement?: (arg: StartElementSAXEventInterface) => void;
  onEndElement?: (arg: EndElementSAXEventInterface) => void;
  onText?: (arg: TextSAXEventInterface) => void;
  onCdata?: (arg: CdataSAXEventInterface) => void;
  onComment?: (arg: CommentSAXEventInterface) => void;
  onError?: (err: unknown) => void;
  onDisplayingXML?: (arg: DisplayingXMLEventInterface) => void;
  onXmlDeclaration?: (arg: XMLdeclarationSAXEventInterface) => void;
}

