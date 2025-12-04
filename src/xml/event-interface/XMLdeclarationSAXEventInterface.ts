import { SAX_XML_DECLARATION_TARGET_TYPE } from "../event";
import { ProcessingInstructionSAXEventInterface } from "./ProcessingInstructionSAXEventInterface";

export interface XMLdeclarationSAXEventInterface extends ProcessingInstructionSAXEventInterface<typeof SAX_XML_DECLARATION_TARGET_TYPE> {
  version: string
  encoding: string
  standalone: "yes" | "no"
}
