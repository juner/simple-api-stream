import type { SAX_DOCTYPE_EVENT_TYPE } from "../event";

export interface DoctypeSAXEventInterface {
  type: typeof SAX_DOCTYPE_EVENT_TYPE;
  doctype: string;
}


