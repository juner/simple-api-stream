import type { DoctypeSAXEventSimpleInterface } from "../event-interface";
import { DoctypeBaseEvent } from "./DoctypeBaseEvent";


export class DoctypeSimpleEvent extends DoctypeBaseEvent implements DoctypeSAXEventSimpleInterface {
  dtdType?: undefined = undefined;
  constructor(root: string, options?: {
    dtdType?: undefined;
  } & ConstructorParameters<typeof DoctypeBaseEvent>[1]) {
    super(root, options);
    this.dtdType = options?.dtdType;
  }
}
