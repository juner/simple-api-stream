import type { SAX_PROCESSING_INSTRUCTION_EVENT_TYPE } from "../event";

export interface ProcessingInstructionEventInterface<T extends string = string> {
  name: typeof SAX_PROCESSING_INSTRUCTION_EVENT_TYPE;
  target: T;
  data: string;
}

