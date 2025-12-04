import type { SAX_START_ELEMENT_EVENT_TYPE } from "../event";

export interface StartElementSAXEventInterface {
  name: typeof SAX_START_ELEMENT_EVENT_TYPE
  tagName: string
  attrs?: Record<string, string>
  selfClosing?: boolean
}
