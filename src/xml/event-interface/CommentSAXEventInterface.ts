import type { SAX_COMMENT_EVENT_TYPE } from "../event/CommentEvent";

export interface CommentSAXEventInterface {
  name: typeof SAX_COMMENT_EVENT_TYPE
  comment: string
}
