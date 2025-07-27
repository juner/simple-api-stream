import { ProcessingInstructionOtherEventInterface } from "../event-interface/ProcessingInstructionOtherEventInterface";
import { ProcessingInstructionBaseEvent } from "./ProcessingInstructionBaseEvent";

export const SAX_PROCESSING_INSTRUCTION_EVENT_TYPE = "processingInstruction";
export class ProcessingInstructionOtherEvent extends ProcessingInstructionBaseEvent<string> implements ProcessingInstructionOtherEventInterface {
  constructor(options: { target: string, data?: string }) {
    super(options);
  }
}

