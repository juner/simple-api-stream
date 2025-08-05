import type { StartDocumentSAEventInterface } from "../event-interface";
import { SAEvent } from "./SAEvent";

export const SA_START_DOCUMENT_EVENT_TYPE = "startDocument";
export class StartDocumentEvent<KIND extends string> extends SAEvent<typeof SA_START_DOCUMENT_EVENT_TYPE> implements StartDocumentSAEventInterface<KIND> {
  kind: KIND;
  constructor(kind: KIND) {
    super(SA_START_DOCUMENT_EVENT_TYPE);
    this.kind = kind;
  }
}
