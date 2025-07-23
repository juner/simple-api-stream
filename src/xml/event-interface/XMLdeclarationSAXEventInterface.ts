import { SAX_XML_DECLARATION_EVENT_TYPE } from "../event";


export interface XMLdeclarationSAXEventInterface {
  type: typeof SAX_XML_DECLARATION_EVENT_TYPE;
  version: string;
  encoding: string;
  standalone: "yes" | "no";
}


