import { ProcessingInstructionEventInterface } from "../event-interface";
import { SAX_PROCESSING_INSTRUCTION_EVENT_TYPE } from "./ProcessingInstructionOtherEvent";
import { SAXEvent } from "./SAXEvent";

export class ProcessingInstructionBaseEvent<T extends string = string> extends SAXEvent<typeof SAX_PROCESSING_INSTRUCTION_EVENT_TYPE> implements ProcessingInstructionEventInterface {
  target: T;
  data: string;
  constructor(options: {target: T, data?: string}) {
    super(SAX_PROCESSING_INSTRUCTION_EVENT_TYPE);
    this.target = options.target;
    this.data = options.data ?? "";
  }
}
