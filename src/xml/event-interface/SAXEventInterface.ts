import type { EndElementSAXEventInterface } from "./EndElementSAXEventInterface";
import type { StartElementSAXEventInterface } from "./StartElementSAXEventInterface";
import type { TextSAXEventInterface } from "./TextSAXEventInterface";
import type { DoctypeSAXEventInterface } from "./DoctypeSAXEventInterface";
import type { CommentSAXEventInterface } from "./CommentSAXEventInterface";
import type { CdataSAXEventInterface } from "./CdataSAXEventInterface";
import { XMLdeclarationSAXEventInterface } from "./XMLdeclarationSAXEventInterface";
import { DisplayingXMLEventInterface } from "./DisplayingXMLEventInterface";

export type SAXEventInterface =
  DoctypeSAXEventInterface
  | StartElementSAXEventInterface
  | EndElementSAXEventInterface
  | TextSAXEventInterface
  | CommentSAXEventInterface
  | CdataSAXEventInterface
  | XMLdeclarationSAXEventInterface
  | DisplayingXMLEventInterface;
