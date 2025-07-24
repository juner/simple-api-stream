import type { DoctypeSAXEventInterface } from "../event-interface";
import { SAXEvent } from "./SAXEvent";

export const SAX_DOCTYPE_EVENT_TYPE = "doctype";
export class DoctypeEvent extends SAXEvent<typeof SAX_DOCTYPE_EVENT_TYPE> implements DoctypeSAXEventInterface {
  doctype: string;
  constructor(doctype: string) {
    super(SAX_DOCTYPE_EVENT_TYPE);
    this.doctype = doctype;
  }
}


