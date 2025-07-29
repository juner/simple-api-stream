import { SAX_XML_DECLARATION_STYLESHEET_TARGET_TYPE } from "../event";
import { ProcessingInstructionEventInterface } from "./ProcessingInstructionEventInterface";

export interface XMLStylesheetDeclarationSAXEventInterface extends ProcessingInstructionEventInterface<typeof SAX_XML_DECLARATION_STYLESHEET_TARGET_TYPE> {
  type: string;
  href: string;
}
