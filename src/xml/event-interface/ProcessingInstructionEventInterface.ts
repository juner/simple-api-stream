import { SAX_PROCESSING_INSTRUCTION_EVENT_TYPE } from "../event/ProcessingInstructionOtherEvent";


export interface ProcessingInstructionEventInterface<T extends string = string> {
  type: typeof SAX_PROCESSING_INSTRUCTION_EVENT_TYPE;
  target: T;
  data: string;
}

