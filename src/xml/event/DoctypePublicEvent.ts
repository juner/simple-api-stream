import type { DoctypeSAXEventPublicInterface } from "../event-interface";
import { DoctypeBaseEvent } from "./DoctypeBaseEvent";


export class DoctypePublicEvent extends DoctypeBaseEvent implements DoctypeSAXEventPublicInterface {
  dtdType: "PUBLIC";
  uri?: string;
  identifer: string;
  constructor(root: string, options: {
    dtdType: "PUBLIC";
    uri?: string;
    identifer: string;
    declarations?: string;
  }) {
    super(root, options);
    this.dtdType = options.dtdType;
    this.uri = options.uri;
    this.identifer = options.identifer;
  }
}
