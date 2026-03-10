/**
 * function to name
 * @param value
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function functionToName<T extends Function>(value: T, removePrefix?: string) {
  const name = value.name;
  if (typeof removePrefix === "string"
    && removePrefix.length > 0
    && name.startsWith(removePrefix)) return name.slice(removePrefix.length);
  return name;
}
