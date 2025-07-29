import { EndArraySAJEventInterface, EndObjectSAJEventInterface, KeySAJEventInterface, StartArraySAJEventInterface, StartObjectSAJEventInterface, ValueBooleanSAJEventInterface, ValueNullSAJEventInterface, ValueNumberSAJEventInterface, ValueStringSAJEventInterface } from "../event-interface";

export interface SAJHandler {
  onStartObject: (arg: StartObjectSAJEventInterface) => void;
  onEndObject: (arg: EndObjectSAJEventInterface) => void;
  onStartArray: (arg: StartArraySAJEventInterface) => void;
  onEndArray: (arg: EndArraySAJEventInterface) => void;
  onKey: (arg: KeySAJEventInterface) => void;
  onValue: (arg: ValueBooleanSAJEventInterface | ValueNumberSAJEventInterface | ValueStringSAJEventInterface | ValueNullSAJEventInterface) => void,
  onError: (err: unknown) => void;
}


