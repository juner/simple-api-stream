import type {
  EndElementSAXEventInterface,
  StartElementSAXEventInterface,
  TextSAXEventInterface,
  DoctypeSAXEventInterface,
  CdataSAXEventInterface,
  CommentSAXEventInterface,
  ProcessingInstructionEventInterface,
} from "../event-interface";

export interface SimpleSAXHandler {
  onDoctype: (arg: DoctypeSAXEventInterface) => void;
  onStartElement: (arg: StartElementSAXEventInterface) => void;
  onEndElement: (arg: EndElementSAXEventInterface) => void;
  onText: (arg: TextSAXEventInterface) => void;
  onCdata: (arg: CdataSAXEventInterface) => void;
  onComment: (arg: CommentSAXEventInterface) => void;
  onError: (err: unknown) => void;
  onProcessingInstruction: (arg: ProcessingInstructionEventInterface<string>) => void;
}


