import type { SAX_COMMENT_EVENT_TYPE } from "../event/CommentEvent";

export interface CommentSAXEventInterface {
  type: typeof SAX_COMMENT_EVENT_TYPE;
  comment: string;
}
