import { SAX_XML_DECLARATION_TARGET_TYPE } from "../event";
import { ProcessingInstructionEventInterface } from "./ProcessingInstructionEventInterface";

export interface XMLdeclarationSAXEventInterface extends ProcessingInstructionEventInterface<typeof SAX_XML_DECLARATION_TARGET_TYPE> {
  version: string;
  encoding: string;
  standalone: "yes" | "no";
}


