import type { EndElementSAXEventInterface } from "./EndElementSAXEventInterface";
import type { StartElementSAXEventInterface } from "./StartElementSAXEventInterface";
import type { TextSAXEventInterface } from "./TextSAXEventInterface";
import type { DtdSAXEventInterface } from "./DtdSAXEventInterface";
import type { CommentSAXEventInterface } from "./CommentSAXEventInterface";
import type { CdataSAXEventInterface } from "./CdataSAXEventInterface";

export type SAXEventInterface =
  DtdSAXEventInterface
  | StartElementSAXEventInterface
  | EndElementSAXEventInterface
  | TextSAXEventInterface
  | CommentSAXEventInterface
  | CdataSAXEventInterface;
