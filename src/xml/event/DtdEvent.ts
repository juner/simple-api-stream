import { SAXEvent } from "./SAXEvent";


export const SAX_DTD_EVENT_TYPE = "dtd";
export class DtdEvent extends SAXEvent<typeof SAX_DTD_EVENT_TYPE> {
  dtd: string;
  constructor(dtd: string) {
    super(SAX_DTD_EVENT_TYPE);
    this.dtd = dtd;
  }
}
