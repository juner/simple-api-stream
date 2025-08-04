import type { StartDocumentSAEventInterface } from "../event-interface";
import { SAEvent } from "./SAEvent";

export const SA_START_DOCUMENT_EVENT_TYPE = "startDocument";
export class StartDocumentEvent extends SAEvent<typeof SA_START_DOCUMENT_EVENT_TYPE> implements StartDocumentSAEventInterface {
  constructor() {
    super(SA_START_DOCUMENT_EVENT_TYPE);
  }
}
