export * as interfaces from "./interface";

//#region xml
import * as xml from "./xml";
export {
  xml as xml,
};
export const XMLTextToSAXEventWritableStream = xml.XMLTextToSAXEventWritableStream;
export const XMLTextToSAXTransformStream = xml.XMLTextToSAXTransformStream;
export const ResolveToSAXReadableStream = xml.ResolveToSAXReadableStream;
export const SAXToXMLTextTransform = xml.SAXToXMLTextTransform;
// #endregion

// #region json
import * as json from "./json";
export {
  json as json,
};
export const JSONTextToSAJEventWritableStream = json.JSONTextToSAJEventWritableStream;
export const ResolveToSAJReadableStream = json.ResolveToSAJReadableStream;
export const JSONTextToSAJTransformStream = json.JSONTextToSAJTransformStream;
export const SAJToObjectTransform = json.SAJToObjectTransform;
// #endregion
