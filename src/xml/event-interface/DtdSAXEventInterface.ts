import type { SAX_DTD_EVENT_TYPE } from "../event";

export interface DtdSAXEventInterface {
  type: typeof SAX_DTD_EVENT_TYPE;
  dtd: string;
}


