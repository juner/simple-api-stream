# Changelog

All notable changes to this project will be documented in this file.  
Adheres to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and uses [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- _No unreleased changes at this time._  

## [1.0.0] - 2025-08-04
### Added
- Initial release of **simple-api-stream** package.
- Streaming JSON utilities (SAJ: Simple API for JSON):
  - `JSONTextToSAJEventWritableStream` — Executes SAJ events on a custom handler.
  - `JSONTextToSAJTransformStream` — Emits typed SAJ event objects from JSON text.
  - `ResolveToSAJReadableStream` — Programmatically resolves SAJ events.
  - `SAJToObjectTransformStream<T>` — Converts SAJ events into JavaScript objects.
- Streaming XML utilities (SAX: Simple API for XML):
  - `XMLTextToSAXEventWritableStream` — Executes SAX events on a custom handler.
  - `XMLTextToSAXTransformStream` — Emits typed SAX event objects from XML text.
  - `ResolveToSAXReadableStream` — Programmatically resolves SAX events.
  - `SAXToXMLTextTransformStream` — Converts SAX events back to XML text.
- Documentation:
  - Event format examples for SAJ (e.g., `startObject`, `key`, `value`) and SAX (e.g., `startElement`, `endElement`, text).
  - Example pipelines: JSON → SAJ → objects, and XML → SAX.
  - Error handling guidelines for malformed JSON/XML streams.
  - Development notes clarifying internal directory structure and recommended import paths (users should import from root package).

[Unreleased]: https://github.com/juner/simple-api-stream/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/juner/simple-api-stream/releases/tag/v1.0.0