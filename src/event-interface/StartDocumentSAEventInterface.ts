import type { SA_START_DOCUMENT_EVENT_TYPE } from "../event";

export interface StartDocumentSAEventInterface<KIND extends string> {
  name: typeof SA_START_DOCUMENT_EVENT_TYPE;
  kind: KIND;
}
