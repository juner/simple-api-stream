import { DoctypeSAXEventBaseInterface } from "./DoctypeSAXEventBaseInterface";

export interface DoctypeSAXEventPublicInterface extends DoctypeSAXEventBaseInterface {
  dtdType: "PUBLIC";
  /** public identifer */
  identifer: string;
  /** uri reference */
  uri: string;
}
