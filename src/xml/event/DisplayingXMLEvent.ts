import type { DisplayingXMLEventInterface } from "../event-interface";
import { SAXEvent } from "./SAXEvent";

export const SAX_DISPLAYING_XML_EVENT_TYPE = "displayingXML";
export class DisplayingXMLEvent extends SAXEvent<typeof SAX_DISPLAYING_XML_EVENT_TYPE> implements DisplayingXMLEventInterface {
  contentType: string;
  href: string;
  constructor(contentType: string, href: string) {
    super(SAX_DISPLAYING_XML_EVENT_TYPE);
    this.contentType = contentType;
    this.href = href;
  }
}
