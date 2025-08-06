/**
 * パラメータ `value` が null / undefined でないことを強制する。もしも null / undefined であるなら throw する
 * @param value 対象となる値
 * @param message
 */
export function assertIsDefined<T>(value: T, message?: string): asserts value is NonNullable<T> {
  if (value === undefined || value === null)
    throw new Error(message ?? "Value is undefined");
}

export function isDefined<T>(value: T): value is NonNullable<T> {
  return !(value === undefined || value === null);
}
