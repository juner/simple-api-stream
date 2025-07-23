import { SAX_DISPLAYING_XML_EVENT_TYPE } from "../event";


export interface DisplayingXMLEventInterface {
  type: typeof SAX_DISPLAYING_XML_EVENT_TYPE;
  contentType: string;
  href: string;
}
