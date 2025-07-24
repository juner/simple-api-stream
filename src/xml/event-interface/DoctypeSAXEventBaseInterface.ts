import type { SAX_DOCTYPE_EVENT_TYPE } from "../event/DoctypeBaseEvent";

export interface DoctypeSAXEventBaseInterface {
  type: typeof SAX_DOCTYPE_EVENT_TYPE;
  root: string;
  declarations?: string;
}
