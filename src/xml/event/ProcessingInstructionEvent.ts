import { ProcessingInstructionEventInterface } from "../event-interface";
import { SAXEvent } from "./SAXEvent";

export const SAX_PROCESSING_INSTRUCTION_EVENT_TYPE = "processingInstruction";
export class ProcessingInstructionEvent<T extends string = string> extends SAXEvent<typeof SAX_PROCESSING_INSTRUCTION_EVENT_TYPE> implements ProcessingInstructionEventInterface {
  target: T;
  data: string;
  constructor(options: {target: T, data?: string}) {
    super(SAX_PROCESSING_INSTRUCTION_EVENT_TYPE);
    this.target = options.target;
    this.data = options.data ?? "";
  }
}
