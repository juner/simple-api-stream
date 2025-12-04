export function toErrorMessage(message: unknown, options?: ErrorOptions): {
  message: string
  options?: ErrorOptions
} {
  let message2: string;
  if (typeof message === "string")
    message2 = message;
  else {
    (options ??= {}).cause ??= message;
    message2 = `${(message as Error | undefined)?.message ?? message}`;
  }
  return { message: message2, options };
}
