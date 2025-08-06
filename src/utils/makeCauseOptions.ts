export function makeCauseOptions(...args: (unknown | undefined)[]): unknown {
  if (args.length <= 0) return undefined;
  let cause: unknown | undefined;
  for (const arg of args) {
    if (typeof (arg ?? undefined) === "undefined") continue;
    cause = Object.assign(cause ?? {}, arg);
  }
  return cause;
}
