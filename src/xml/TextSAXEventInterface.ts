import { SAX_TEXT_EVENT_TYPE } from "./event/TextEvent";

export interface TextSAXEventInterface {
  name: typeof SAX_TEXT_EVENT_TYPE;
  text: string;
}
