import type { EndElementSAXEventInterface } from "./EndElementSAXEventInterface";
import type { StartElementSAXEventInterface } from "./StartElementSAXEventInterface";
import type { TextSAXEventInterface } from "./TextSAXEventInterface";
import type { DoctypeSAXEventInterface } from "./DoctypeSAXEventInterface";
import type { CommentSAXEventInterface } from "./CommentSAXEventInterface";
import type { CdataSAXEventInterface } from "./CdataSAXEventInterface";
import { XMLdeclarationSAXEventInterface } from "./XMLdeclarationSAXEventInterface";
import { XMLStylesheetDeclarationSAXEventInterface } from "./XMLStylesheetDeclarationSAXEventInterface";
import { ProcessingInstructionEventInterface } from "./ProcessingInstructionEventInterface";

export type SAXEventInterface =
  DoctypeSAXEventInterface
  | StartElementSAXEventInterface
  | EndElementSAXEventInterface
  | TextSAXEventInterface
  | CommentSAXEventInterface
  | CdataSAXEventInterface
  | XMLdeclarationSAXEventInterface
  | XMLStylesheetDeclarationSAXEventInterface
  | ProcessingInstructionEventInterface;
