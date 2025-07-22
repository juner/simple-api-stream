import { SAX_DTD_EVENT_TYPE } from "./event/DtdEvent";

export interface DtdSAXEventInterface {
  name: typeof SAX_DTD_EVENT_TYPE;
  dtd: string;
}
