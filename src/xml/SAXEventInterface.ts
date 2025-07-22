import type { EndElementSAXEventInterface } from "./EndElementSAXEventInterface";
import type { StartElementSAXEventInterface } from "./StartElementSAXEventInterface";
import type { TextSAXEventInterface } from "./TextSAXEventInterface";

export type SAXEventInterface = StartElementSAXEventInterface | EndElementSAXEventInterface | TextSAXEventInterface;
