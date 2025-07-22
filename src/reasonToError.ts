export function reasonToError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason), { cause: reason });
}
