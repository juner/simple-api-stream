import { SAX_START_ELEMENT_EVENT_TYPE } from "./event/StartElementEvent";


export interface StartElementSAXEventInterface {
  name: typeof SAX_START_ELEMENT_EVENT_TYPE;
  tagName: string;
  attrs: Record<string, string>;
  selfClosing: boolean;
}

