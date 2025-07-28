import type { XMLdeclarationSAXEventInterface } from "../event-interface";
import { ProcessingInstructionEvent } from "./ProcessingInstructionEvent";

export const SAX_XML_DECLARATION_TARGET_TYPE = "xml";
export class XMLDeclarationEvent extends ProcessingInstructionEvent<typeof SAX_XML_DECLARATION_TARGET_TYPE> implements XMLdeclarationSAXEventInterface {
  version: string;
  encoding: string;
  standalone: "yes" | "no";
  constructor({target, version = "1.0", encoding = "UTF-8", standalone = "yes"}:{target: typeof SAX_XML_DECLARATION_TARGET_TYPE, version: string, encoding: string, standalone: "yes" | "no"}) {
    super({target, data:XMLDeclarationEvent.#makeData(version, encoding, standalone)});
    this.version = version;
    this.encoding = encoding;
    this.standalone = standalone;
  }
  static #makeData(version: string, encoding: string, standalone: "yes"|"no" = "yes") {
    const joins:string[] = [];
    if (version)
      joins.push(`version="${version}"`);
    if (encoding)
      joins.push(`encoding="${encoding}"`);
    if (standalone !== "yes")
      joins.push(`standalone="${standalone}"`);
    return joins.join(" ");
  }
}
