import type {
  EndElementSAXEventInterface,
  StartElementSAXEventInterface,
  TextSAXEventInterface,
  DoctypeSAXEventInterface,
  CdataSAXEventInterface,
  CommentSAXEventInterface,
  ProcessingInstructionSAXEventInterface,
  StartDocumentSAXEventInterface,
  EndDocumentSAXEventInterface,
} from "../event-interface";

export interface SAXHandler {
  onDoctype: (arg: DoctypeSAXEventInterface) => void;
  onStartElement: (arg: StartElementSAXEventInterface) => void;
  onEndElement: (arg: EndElementSAXEventInterface) => void;
  onText: (arg: TextSAXEventInterface) => void;
  onCdata: (arg: CdataSAXEventInterface) => void;
  onComment: (arg: CommentSAXEventInterface) => void;
  onError: (err: unknown) => void;
  onProcessingInstruction: (arg: ProcessingInstructionSAXEventInterface<string>) => void;
  onStartDocument: (arg: StartDocumentSAXEventInterface) => void;
  onEndDocument: (arg: EndDocumentSAXEventInterface) => void;
}
