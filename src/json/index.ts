
export * as events from "./event";

export type * as eventInterface from "./event-interface";
export type * as interfaces from "./interface";

import * as JSONTextToSAJEventWritableStreamModule from "./JSONTextToSAJEventWritableStream";
import * as ResolveToSAJReadableStreamModule from "./ResolveToSAJReadableStream";
import * as JSONTextToSAJTransformStreamModule from "./JSONTextToSAJTransformStream";
import * as SAJToObjectTransformModule from "./SAJToObjectTransformStream";
import * as JSONTextToSAJParserModule from "./JSONTextToSAJParser";

export const streams = {
  ...JSONTextToSAJEventWritableStreamModule,
  ...ResolveToSAJReadableStreamModule,
  ...SAJToObjectTransformModule,
  ...JSONTextToSAJParserModule,
};
export const JSONTextToSAJEventWritableStream = JSONTextToSAJEventWritableStreamModule.JSONTextToSAJEventWritableStream;
export const ResolveToSAJReadableStream = ResolveToSAJReadableStreamModule.ResolveToSAJReadableStream;
export const JSONTextToSAJTransformStream = JSONTextToSAJTransformStreamModule.JSONTextToSAJTransformStream;
export const SAJToObjectTransformStream = SAJToObjectTransformModule.SAJToObjectTransformStream;
