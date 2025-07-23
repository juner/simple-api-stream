import type { CdataSAXEventInterface } from "../event-interface";
import { SAXEvent } from "./SAXEvent";


export const SAX_CDATA_EVENT_TYPE = "cdata";
export class CdataEvent extends SAXEvent<typeof SAX_CDATA_EVENT_TYPE> implements CdataSAXEventInterface {
  cdata: string;
  constructor(cdata: string) {
    super(SAX_CDATA_EVENT_TYPE);
    this.cdata = cdata;
  }
}
