import { ProcessingInstructionOtherEvent } from "./ProcessingInstructionOtherEvent";
import { XMLDeclarationEvent } from "./XMLDeclarationEvent";
import { XMLStylesheetDeclarationEvent } from "./XMLStylesheetDeclarationEvent";

export type ProcessingInstructionEvent = typeof ProcessingInstructionOtherEvent | typeof XMLDeclarationEvent | typeof XMLStylesheetDeclarationEvent;
