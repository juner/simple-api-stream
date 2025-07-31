export * as events from "./event";

export type * as eventInterface from "./event-interface";
export type * as interfaces from "./interface";

import * as XMLTextToSAXEventWritableStreamModule from "./XMLTextToSAXEventWritableStream";
import * as XMLTextToSAXTransformStreamModule from "./XMLTextToSAXTransformStream";
import * as ResolveToSAXReadableStreamModule from "./ResolveToSAXReadableStream";
import * as SAXToXMLTextTransformModule from "./SAXToXMLTextTransformStream";
import * as XMLTextToSAXParserModule from "./XMLTextToSAXParser";
export const streams = {
  ...XMLTextToSAXEventWritableStreamModule,
  ...XMLTextToSAXTransformStreamModule,
  ...ResolveToSAXReadableStreamModule,
  ...SAXToXMLTextTransformModule,
  ...XMLTextToSAXParserModule,
};
export const XMLTextToSAXEventWritableStream = XMLTextToSAXEventWritableStreamModule.XMLTextToSAXEventWritableStream;
export const XMLTextToSAXTransformStream = XMLTextToSAXTransformStreamModule.XMLTextToSAXTransformStream;
export const ResolveToSAXReadableStream = ResolveToSAXReadableStreamModule.ResolveToSAXReadableStream;
export const SAXToXMLTextTransform = SAXToXMLTextTransformModule.SAXToXMLTextTransformStream;
