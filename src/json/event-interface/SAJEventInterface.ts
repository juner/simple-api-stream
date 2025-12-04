import type { EndArraySAJEventInterface } from "./EndArraySAJEventInterface";
import type { EndObjectSAJEventInterface } from "./EndObjectSAJEventInterface";
import type { KeySAJEventInterface } from "./KeySAJEventInterface";
import type { StartArraySAJEventInterface } from "./StartArraySAJEventInterface";
import type { StartObjectSAJEventInterface } from "./StartObjectSAJEventInterface";
import type { ValueBooleanSAJEventInterface } from "./ValueBooleanSAJEventInterface";
import type { ValueNullSAJEventInterface } from "./ValueNullSAJEventInterface";
import type { ValueNumberSAJEventInterface } from "./ValueNumberSAJEventInterface";
import type { ValueStringSAJEventInterface } from "./ValueStringSAJEventInterface";
import type { StartDocumentSAJEventInterface } from "./StartDocumentSAJEventInterface";
import type { EndDocumentSAJEventInterface } from "./EndDocumentSAJEventInterface";

export type SAJEventInterface
  = StartArraySAJEventInterface
    | EndArraySAJEventInterface
    | StartObjectSAJEventInterface
    | EndObjectSAJEventInterface
    | KeySAJEventInterface
    | ValueBooleanSAJEventInterface
    | ValueNullSAJEventInterface
    | ValueNumberSAJEventInterface
    | ValueStringSAJEventInterface
    | StartDocumentSAJEventInterface
    | EndDocumentSAJEventInterface;
