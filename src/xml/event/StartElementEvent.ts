import { SAXEvent } from "./SAXEvent";
import { StartElementSAXEventInterface } from "../StartElementSAXEventInterface";

export const SAX_START_ELEMENT_EVENT_TYPE = "startElement";
export class StartElementEvent extends SAXEvent<typeof SAX_START_ELEMENT_EVENT_TYPE> implements StartElementSAXEventInterface {
  tagName: string;
  attrs: Record<string, string>;
  selfClosing: boolean;
  constructor(tagName: string, attrs: Record<string, string> = {}, selfClosing: boolean = false) {
    super(SAX_START_ELEMENT_EVENT_TYPE);
    this.tagName = tagName;
    this.attrs = attrs;
    this.selfClosing = selfClosing;
  }
}

