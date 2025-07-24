import type { DoctypeSAXEventSystemInterface } from "../event-interface";
import { DoctypeBaseEvent } from "./DoctypeBaseEvent";


export class DoctypeSystemEvent extends DoctypeBaseEvent implements DoctypeSAXEventSystemInterface {
  dtdType: "SYSTEM" = "SYSTEM";
  uri: string;
  constructor(root: string, options: {
    dtdType: "SYSTEM";
    uri: string;
    declarations?: string;
  }) {
    super(root, options);
    this.uri = options.uri;
  }
}
