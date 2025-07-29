import type { XMLStylesheetDeclarationSAXEventInterface } from "../event-interface";
import { ProcessingInstructionEvent } from "./ProcessingInstructionEvent";

export const SAX_XML_DECLARATION_STYLESHEET_TARGET_TYPE = "xml-stylesheet";
export class XMLStylesheetDeclarationEvent extends ProcessingInstructionEvent<typeof SAX_XML_DECLARATION_STYLESHEET_TARGET_TYPE> implements XMLStylesheetDeclarationSAXEventInterface {
  type: string;
  href: string;
  constructor({ target, contentType, href }: { target: typeof SAX_XML_DECLARATION_STYLESHEET_TARGET_TYPE, contentType: string, href: string }) {
    super(target, XMLStylesheetDeclarationEvent.#makeData(contentType, href));
    this.type = contentType;
    this.href = href;
  }
  static #makeData(contentType: string, href: string) {
    const joins: string[] = [];
    if (contentType)
      joins.push(`type="${contentType}"`);
    if (href)
      joins.push(`href="${href}"`);
    return joins.join(" ");
  }
}
