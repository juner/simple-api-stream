
export * as events from "./event";

export type * as eventInterface from "./event-interface";
export type * as interfaces from "./interface";

import * as JSONTextToSAJEventWritableStreamModule from "./JSONTextToSAJEventWritableStream";
import * as ResolveToSAJReadableStreamModule from "./ResolveToSAJReadableStream";
import * as JSONTextToSAJTransformStreamModule from "./JSONTextToSAJTransformStream";
import * as SAJToObjectTransformStreamModule from "./SAJToObjectTransformStream";
import * as JSONTextToSAJParserModule from "./JSONTextToSAJParser";
import * as ObjectToSAJTransformStreamModule from "./ObjectToSAJTransformStream";

export const streams = {
  ...JSONTextToSAJEventWritableStreamModule,
  ...ResolveToSAJReadableStreamModule,
  ...SAJToObjectTransformStreamModule,
  ...JSONTextToSAJParserModule,
  ...ObjectToSAJTransformStreamModule,
};
export const JSONTextToSAJEventWritableStream = JSONTextToSAJEventWritableStreamModule.JSONTextToSAJEventWritableStream;
export const ResolveToSAJReadableStream = ResolveToSAJReadableStreamModule.ResolveToSAJReadableStream;
export const JSONTextToSAJTransformStream = JSONTextToSAJTransformStreamModule.JSONTextToSAJTransformStream;
export const SAJToObjectTransformStream = SAJToObjectTransformStreamModule.SAJToObjectTransformStream;
export const ObjectToSAJTransformStream = ObjectToSAJTransformStreamModule.ObjectToSAJTransformStream;
