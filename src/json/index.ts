
export * as events from "./event";

export type * as eventInterface from "./event-interface";
export type * as interfaces from "./interface";

import * as JSONTextToSAJEventWritableStreamModule from "./JSONTextToSAJEventWritableStream";
import * as ResolveToSAJReadableStreamModule from "./ResolveToSAJReadableStream";

export const streams = {
  ...JSONTextToSAJEventWritableStreamModule,
  ...ResolveToSAJReadableStreamModule,
};
export const JSONTextToSAJEventWritableStream = JSONTextToSAJEventWritableStreamModule.JSONTextToSAJEventWritableStream;
export const ResolveToSAJReadableStream = ResolveToSAJReadableStreamModule.ResolveToSAJReadableStream;
