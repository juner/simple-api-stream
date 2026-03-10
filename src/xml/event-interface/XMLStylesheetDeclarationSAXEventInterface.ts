import { SAX_XML_DECLARATION_STYLESHEET_TARGET_TYPE } from "../event";
import type { ProcessingInstructionSAXEventInterface } from "./ProcessingInstructionSAXEventInterface";

export interface XMLStylesheetDeclarationSAXEventInterface extends ProcessingInstructionSAXEventInterface<typeof SAX_XML_DECLARATION_STYLESHEET_TARGET_TYPE> {
  type: string
  href: string
}
