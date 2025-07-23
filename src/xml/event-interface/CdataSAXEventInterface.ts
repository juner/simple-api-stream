import type { SAX_CDATA_EVENT_TYPE } from "../event/CdataEvent";

export interface CdataSAXEventInterface {
  type: typeof SAX_CDATA_EVENT_TYPE;
  cdata: string;
}
