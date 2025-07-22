export function reasonToError(reason: unknown): Error {
  if (reason instanceof Error)
    return reason;
  return new Error(String(reason), { cause: reason });
}
