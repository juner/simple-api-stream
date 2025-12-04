import { DoctypePublicEvent } from "./DoctypePublicEvent";
import { DoctypeSimpleEvent } from "./DoctypeSimpleEvent";
import { DoctypeSystemEvent } from "./DoctypeSystemEvent";

export type DoctypeEvent = typeof DoctypePublicEvent | typeof DoctypeSimpleEvent | typeof DoctypeSystemEvent;
