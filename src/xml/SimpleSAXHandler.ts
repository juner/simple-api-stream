import type { EndElementSAXEventInterface } from "./EndElementSAXEventInterface";
import type { StartElementSAXEventInterface } from "./StartElementSAXEventInterface";
import type { TextSAXEventInterface } from "./TextSAXEventInterface";


export interface SimpleSAXHandler {
  onStartElement?: (arg: StartElementSAXEventInterface) => void;
  onEndElement?: (arg: EndElementSAXEventInterface) => void;
  onText?: (arg: TextSAXEventInterface) => void;
  onDtd?: (arg:)
  onError?: (err: unknown) => void;
}

