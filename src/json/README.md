# JSON Streaming Utilities (`src/json`)

> **Note:** This README is for **internal development** of the `simple-api-stream` package.
> The JSON streaming utilities documented here are **re-exported from the root package**.
> Users of the published package can import directly from `"simple-api-stream"`.

These utilities provide **streaming JSON parsing** into a structured, event-based format (SAJ = “Simple API for JSON”), and then materialize it into JavaScript objects.
They are designed for **incremental processing of large or untrusted JSON payloads** using the **Web Streams API**, with proper backpressure handling.

---

## Features

| Class | Input | Output |
|-------|-------|--------|
| [`JSONTextToSAJEventWritableStream`](./JSONTextToSAJEventWritableStream.ts) | JSON text from a `ReadableStream<string>` | Executes events on a provided [`SAJHandler`](./interface/SAJHandler.ts) |
| [`JSONTextToSAJTransformStream`](./JSONTextToSAJTransformStream.ts) | JSON text from a `ReadableStream<string>` | Emits [`SAJEventInterface`](./event-interface/SAJEventInterface.ts) objects |
| [`ResolveToSAJReadableStream`](./ResolveToSAJReadableStream.ts) | Invokes [`SAJResolver`](./interface/SAJResolver.ts) methods manually | Emits resolved [`SAJEventInterface`](./event-interface/SAJEventInterface.ts) |
| [`SAJToObjectTransformStream<T>`](./SAJToObjectTransformStream.ts) | `SAJEventInterface` stream | Outputs JavaScript objects of type `T` |

---

## Getting Started (Development)

During development, you may import directly via relative paths:

```ts
// Example: local development inside the repo
import { JSONTextToSAJTransformStream } from "../../json/JSONTextToSAJTransformStream.ts";
```

When consumed via the built ESM package (npm install), import from the root:

```ts
import { JSONTextToSAJTransformStream } from "simple-api-stream";
```

---

## Basic Pipeline Example

```ts
const jsonTextStream = getReadableStreamOfJSONString();
// e.g., fetch(url).body as ReadableStream<string>

// 1. Convert JSON text → SAJ events
const sajEventStream = jsonTextStream.pipeThrough(
  new JSONTextToSAJTransformStream()
);

// 2. Convert SAJ events → JS objects
const objectStream = sajEventStream.pipeThrough(
  new SAJToObjectTransformStream<MyType>()
);

// 3. Consume as async iterator
for await (const obj of objectStream) {
  console.log("Parsed object:", obj);
}
```

---

## SAJ Events

SAJ represents JSON as a **sequence of discrete events**, allowing incremental handling.

### Event Types

#### Structural Events

- `startDocument`
  Makrs the beginning of an document.
  Example:
  ```ts
  { name: "startDocument" }
  ```

- `endDocument`
  Marks the end of the current document.
  Example:
  ```ts
  { name: "endDocument" }
  ```

- `startObject`
  Marks the beginning of an object.
  Example:
  ```ts
  { name: "startObject" }
  ```

- `endObject`
  Marks the end of the current object.
  Example:
  ```ts
  { name: "endObject" }
  ```

- `startArray`
  Marks the beginning of an array.
  Example:
  ```ts
  { name: "startArray" }
  ```

- `endArray`
  Marks the end of the current array.
  Example:
  ```ts
  { name: "endArray" }
  ```

#### Key / Value Events

- `key`
  Represents an object property key.
  ```ts
  { name: "key", key: "name" }
  ```

- `value`
  Represents a primitive JSON value. Types:

  ```ts
  { name: "value", type: "string", value: "hello" }
  { name: "value", type: "number", value: 42 }
  { name: "value", type: "boolean", value: true }
  { name: "value", type: "null", value: null }
  ```

---

### Example Event Sequence for `{ "a": [1, null] }`

Shown here in **JSON Lines** style:

```jsonl
{ "name": "startObject" }
{ "name": "key", "key": "a" }
{ "name": "startArray" }
{ "name": "value", "type": "number", "value": 1 }
{ "name": "value", "type": "null", "value": null }
{ "name": "endArray" }
{ "name": "endObject" }
```

---

## Usage Patterns

- **Event-driven handlers**
  Use `JSONTextToSAJEventWritableStream` with a custom `SAJHandler` to react to events as they occur.

- **Transform pipelines**
  Combine `JSONTextToSAJTransformStream` → `SAJToObjectTransformStream` to parse JSON into objects incrementally.

- **Internal resolution**
  `ResolveToSAJReadableStream` can drive a resolver and produce an SAJ event stream.

---

## Error Handling

- Malformed JSON or unexpected tokens **error the stream**.
- In a transform pipeline, catch via `try/catch` with `for await` or via stream `reader.closed`.

---

## API Links

- [`SAJHandler`](./interface/SAJHandler.ts) — interface for event-driven consumption.
- [`SAJResolver`](./interface/SAJResolver.ts) — interface for manually resolving events.
- [`SAJEventInterface`](./event-interface/SAJEventInterface.ts) — typed SAJ event objects.
- Transform/writable streams listed in [Features](#features).

---

## Internal Notes

- This directory (`src/json`) is **not intended for direct import in user code**.
- Build outputs are bundled into the top-level ESM for distribution.
