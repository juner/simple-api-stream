import type { DoctypeSAXEventPublicInterface } from "./DoctypeSAXEventPublicInterface";
import type { DoctypeSAXEventSimpleInterface } from "./DoctypeSAXEventSimpleInterface";
import type { DoctypeSAXEventSystemInterface } from "./DoctypeSAXEventSystemInterface";

export type DoctypeSAXEventInterface = DoctypeSAXEventSimpleInterface | DoctypeSAXEventPublicInterface | DoctypeSAXEventSystemInterface;
