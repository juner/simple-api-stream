import type { CommentSAXEventInterface } from "../event-interface/CommentSAXEventInterface";
import { SAXEvent } from "./SAXEvent";

export const SAX_COMMENT_EVENT_TYPE = "comment";
export class CommentEvent extends SAXEvent<typeof SAX_COMMENT_EVENT_TYPE> implements CommentSAXEventInterface{
  comment: string;
  constructor(comment: string) {
    super(SAX_COMMENT_EVENT_TYPE);
    this.comment = comment;
  }
}
