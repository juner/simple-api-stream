# simple-api-stream

Streaming utilities for **incremental JSON and XML processing** using the [Web Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Streams_API).  
Provides **event-based parsing** (SAJ for JSON, SAX for XML) and transformation into JavaScript objects with proper backpressure handling.

---

## ✨ Features

| Module | Class | Input | Output |
|--------|-------|-------|--------|
| **JSON** | [`JSONTextToSAJEventWritableStream`](./src/json/JSONTextToSAJEventWritableStream.ts) | JSON text (`ReadableStream<string>`) | Executes events on a [`SAJHandler`](./src/json/interface/SAJHandler.ts) |
| | [`JSONTextToSAJTransformStream`](./src/json/JSONTextToSAJTransformStream.ts) | JSON text | Emits [`SAJEventInterface`](./src/json/event-interface/SAJEventInterface.ts) objects |
| | [`ResolveToSAJReadableStream`](./src/json/ResolveToSAJReadableStream.ts) | Invokes a [`SAJResolver`](./src/json/interface/SAJResolver.ts) | Emits resolved SAJ events |
| | [`SAJToObjectTransformStream<T>`](./src/json/SAJToObjectTransformStream.ts) | SAJ event stream | JavaScript objects of type `T` |
| **XML** | [`XMLTextToSAXEventWritableStream`](./src/xml/XMLTextToSAXEventWritableStream.ts) | XML text (`ReadableStream<string>`) | Executes events on a [`SAXHandler`](./src/xml/interface/SAXHandler.ts) |
| | [`XMLTextToSAXTransformStream`](./src/xml/XMLTextToSAXTransformStream.ts) | XML text | Emits [`SAXEventInterface`](./src/xml/event-interface/SAXEventInterface.ts) objects |
| | [`ResolveToSAXReadableStream`](./src/xml/ResolveToSAXReadableStream.ts) | Invokes a [`SAXResolver`](./src/xml/interface/SAXResolver.ts) | Emits resolved SAX events |
| | [`SAXToXMLTextTransformStream`](./src/xml/SAXToXMLTextTransformStream.ts) | SAX event stream | XML text |

---

## 🚀 Installation

```bash
npm install simple-api-stream
```

## 📦 Basic Usage

### JSON Example
```ts
import {
  JSONTextToSAJTransformStream,
  SAJToObjectTransformStream,
} from "simple-api-stream";

const jsonTextStream = getReadableStreamOfJSONString();

const objectStream = jsonTextStream
  .pipeThrough(new JSONTextToSAJTransformStream())
  .pipeThrough(new SAJToObjectTransformStream<MyType>());

for await (const obj of objectStream) {
  console.log("Parsed object:", obj);
}
```

### XML Example
```ts
import {
  XMLTextToSAXTransformStream,
} from "simple-api-stream";

const xmlTextStream = getReadableStreamOfXMLString();

const saxEventStream = xmlTextStream.pipeThrough(
  new XMLTextToSAXTransformStream()
);

for await (const event of saxEventStream) {
  console.log("SAX event:", event);
}
```

## 📜 Event Formats

### SAJ (Simple API for JSON)
Example for `{ "a": [1, null] }` (JSON Lines format):

```js
{ "name": "startObject" }
{ "name": "key", "key": "a" }
{ "name": "startArray" }
{ "name": "value", "type": "number", "value": 1 }
{ "name": "value", "type": "null", "value": null }
{ "name": "endArray" }
{ "name": "endObject" }
```

### SAX (Simple API for XML)
Example for `<a href="https://example.com">Hello</a>`:

```js
{ "name": "startElement", "tagName": "a", "attrs": { "href": "https://example.com" }, "selfClosing": false }
{ "name": "text", "text": "Hello" }
{ "name": "endElement" }
```

## ⚠️ Error Handling
- Malformed JSON/XML errors the stream.
- In a transform pipeline, catch via try/catch with for await, or via the stream’s reader.closed promise.

### 🛠 Development Notes
- Internal utilities live in src/json and src/xml.
- End-users should import from the root package (simple-api-stream), not from internal paths.