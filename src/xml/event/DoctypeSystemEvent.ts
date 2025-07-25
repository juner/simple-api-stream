import type { DoctypeSAXEventSystemInterface } from "../event-interface";
import { DoctypeBaseEvent } from "./DoctypeBaseEvent";


export class DoctypeSystemEvent extends DoctypeBaseEvent implements DoctypeSAXEventSystemInterface {
  dtdType: "SYSTEM";
  uri: string;
  constructor(root: string, options: {
    dtdType: "SYSTEM";
    uri: string;
    declarations?: string;
  }) {
    super(root, options);
    this.dtdType = options.dtdType;
    this.uri = options.uri;
  }
}
