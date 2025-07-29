import { EndArraySAJEventInterface } from "./EndArraySAJEventInterface";
import { EndObjectSAJEventInterface } from "./EndObjectSAJEventInterface";
import { KeySAJEventInterface } from "./KeySAJEventInterface";
import { StartArraySAJEventInterface } from "./StartArraySAJEventInterface";
import { StartObjectSAJEventInterface } from "./StartObjectSAJEventInterface";
import { ValueBooleanSAJEventInterface } from "./ValueBooleanSAJEventInterface";
import { ValueNullSAJEventInterface } from "./ValueNullSAJEventInterface";
import { ValueNumberSAJEventInterface } from "./ValueNumberSAJEventInterface";
import { ValueStringSAJEventInterface } from "./ValueStringSAJEventInterface";

export type SAJEventInterface =
  StartArraySAJEventInterface
  | EndArraySAJEventInterface
  | StartObjectSAJEventInterface
  | EndObjectSAJEventInterface
  | KeySAJEventInterface
  | ValueBooleanSAJEventInterface
  | ValueNullSAJEventInterface
  | ValueNumberSAJEventInterface
  | ValueStringSAJEventInterface;
