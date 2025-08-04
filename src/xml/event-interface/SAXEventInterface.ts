import type { EndElementSAXEventInterface } from "./EndElementSAXEventInterface";
import type { StartElementSAXEventInterface } from "./StartElementSAXEventInterface";
import type { TextSAXEventInterface } from "./TextSAXEventInterface";
import type { DoctypeSAXEventInterface } from "./DoctypeSAXEventInterface";
import type { CommentSAXEventInterface } from "./CommentSAXEventInterface";
import type { CdataSAXEventInterface } from "./CdataSAXEventInterface";
import type { XMLdeclarationSAXEventInterface } from "./XMLdeclarationSAXEventInterface";
import type { XMLStylesheetDeclarationSAXEventInterface } from "./XMLStylesheetDeclarationSAXEventInterface";
import type { ProcessingInstructionSAXEventInterface } from "./ProcessingInstructionSAXEventInterface";
import type { StartDocumentSAXEventInterface } from "./StartDocumentSAXEventInterface";
import type { EndDocumentSAXEventInterface } from "./EndDocumentSAXEventInterface";

export type SAXEventInterface =
  DoctypeSAXEventInterface
  | StartElementSAXEventInterface
  | EndElementSAXEventInterface
  | TextSAXEventInterface
  | CommentSAXEventInterface
  | CdataSAXEventInterface
  | XMLdeclarationSAXEventInterface
  | XMLStylesheetDeclarationSAXEventInterface
  | ProcessingInstructionSAXEventInterface
  | StartDocumentSAXEventInterface
  | EndDocumentSAXEventInterface;
