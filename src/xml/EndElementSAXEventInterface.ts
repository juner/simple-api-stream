import { SAX_END_ELEMENT_EVENT_TYPE } from "./event/EndElementEvent";

export interface EndElementSAXEventInterface {
  name: typeof SAX_END_ELEMENT_EVENT_TYPE;
  tagName: string;
}
