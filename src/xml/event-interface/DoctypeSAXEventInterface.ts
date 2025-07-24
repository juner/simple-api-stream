import { DoctypeSAXEventPublicInterface } from "./DoctypeSAXEventPublicInterface";
import { DoctypeSAXEventSimpleInterface } from "./DoctypeSAXEventSimpleInterface";
import { DoctypeSAXEventSystemInterface } from "./DoctypeSAXEventSystemInterface";

export type DoctypeSAXEventInterface = DoctypeSAXEventSimpleInterface | DoctypeSAXEventPublicInterface | DoctypeSAXEventSystemInterface;
