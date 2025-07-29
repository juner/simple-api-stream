export interface SimpleApiParser<T> {
  enqueue(chunk: T): void;
  flush(): void;
}
