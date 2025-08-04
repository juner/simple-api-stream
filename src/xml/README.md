# XML Streaming Utilities (`src/xml`)

> **Note:** This README is for **internal development** of the `simple-api-stream` package.
> The XML streaming utilities documented here are **re-exported from the root package**.
> Users of the published package can import directly from `"simple-api-stream"`.

These utilities provide **streaming XML parsing** into a structured, event-based format (SAX = “Simple API for XML”), and then materialize it into JavaScript objects.
Designed for **incremental processing of large or untrusted JSON payloads** using **Web Streams API** with proper backpressure handling.

---

## Features

| Class | Input | Output |
|-------|-------|--------|
| [`XMLTextToSAXEventWritableStream`](./XMLTextToSAXEventWritableStream.ts) | XML text from a `ReadableStream<string>` | Executes events on a provided [`SAXHandler`](./interface/SAXHandler.ts) |
| [`XMLTextToSAXTransformStream`](./XMLTextToSAXTransformStream.ts) | XML text from a `ReadableStream<string>` | Emits [`SAXEventInterface`](./event-interface/SAXEventInterface.ts) objects |
| [`ResolveToSAXReadableStream`](./ResolveToSAXReadableStream.ts) | Invokes [`SAXResolver`](./interface/SAXResolver.ts) methods manually | Emits resolved [`SAXEventInterface`](./event-interface/SAXEventInterface.ts) |
| [`SAXToXMLTextTransformStream`](./SAXToXMLTextTransformStream.ts) | `SAJEventInterface` stream | Outputs XML text to a `REadableStream<string>` |

## Getting Started (Development)

During development, you may import directly via relative paths:

```ts
// Example: local development inside the repo
import { XMLTextToSAXTransformStream } from "../../json/XMLTextToSAXTransformStream.ts";
```

When consumed via the built ESM package (npm install), import from the root:

```ts
import { XMLTextToSAXTransformStream } from "simple-api-stream";
```

## SAX Events

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

- `startElement`
  Marks the beginning of an element.
  Example:
  ```ts
  { name: "startElement", tagName: "a", attrs: { href: "https://example.com" }, selfClosing: false}
  ```

- `endElement`
  Marks the end of the current element.
  Example:
  ```ts
  { name: "endElement" }
  ```


