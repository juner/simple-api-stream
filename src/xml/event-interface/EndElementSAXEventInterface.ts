import type { SAX_END_ELEMENT_EVENT_TYPE } from "../event";

export interface EndElementSAXEventInterface {
  type: typeof SAX_END_ELEMENT_EVENT_TYPE;
  tagName: string;
}
