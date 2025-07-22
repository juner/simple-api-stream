import type { EndElementSAXEventInterface } from "./EndElementEvent";
import type { StartElementSAXEventInterface } from "./StartElementEvent";
import type { TextSAXEventInterface } from "./TextEvent";


export interface SimpleSAXHandler {
  onStartElement?: (arg: StartElementSAXEventInterface) => void;
  onEndElement?: (arg: EndElementSAXEventInterface) => void;
  onText?: (arg: TextSAXEventInterface) => void;
  onError?: (err: Error) => void;
}
export type SAXEventInterface = StartElementSAXEventInterface | EndElementSAXEventInterface | TextSAXEventInterface;
