import type { XMLdeclarationSAXEventInterface } from "../event-interface";
import { SAXEvent } from "./SAXEvent";

export const SAX_XML_DECLARATION_EVENT_TYPE = "xmlDeclaration";
export class XMLDeclarationEvent extends SAXEvent<typeof SAX_XML_DECLARATION_EVENT_TYPE> implements XMLdeclarationSAXEventInterface {
  version: string;
  encoding: string;
  standalone: "yes" | "no";
  constructor(version: string = "1.0", encoding: string = "UTF-8", standalone: "yes" | "no" = "yes") {
    super(SAX_XML_DECLARATION_EVENT_TYPE);
    this.version = version;
    this.encoding = encoding;
    this.standalone = standalone;
  }
}
