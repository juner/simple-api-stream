import { DoctypeSAXEventBaseInterface } from "./DoctypeSAXEventBaseInterface";

export interface DoctypeSAXEventSystemInterface extends DoctypeSAXEventBaseInterface {
  dtdType: "SYSTEM";
  /** uri reference */
  uri: string;
}
