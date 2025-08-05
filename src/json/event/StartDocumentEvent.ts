import { StartDocumentEvent as BaseEvent } from "../../event";
import { StartDocumentSAJEventInterface } from "../event-interface";
export const SAJ_START_DOCUMENT_EVENT_KIND = "json";
export class StartDocumentEvent extends BaseEvent<typeof SAJ_START_DOCUMENT_EVENT_KIND> implements StartDocumentSAJEventInterface {
  constructor() {
    super(SAJ_START_DOCUMENT_EVENT_KIND);
  }
}
