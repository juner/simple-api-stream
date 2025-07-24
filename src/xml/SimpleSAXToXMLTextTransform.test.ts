import { test } from "vitest";
import { SimpleSAXToXMLTextTransform } from ".";

test("empty chunks", async ({ expect }) => {
  const { readable, writable } = new SimpleSAXToXMLTextTransform();
  const response = new Response(readable
    .pipeThrough(new TextEncoderStream()));
  await writable.close();
  const text = await response.text();
  expect(text).toHaveLength(0);
});

test("empty chunks", async ({ expect }) => {
  const { readable, writable } = new SimpleSAXToXMLTextTransform();
  (async () => {
    const writer = writable.getWriter();
    await writer.write({ type: "startElement", tagName: "a", attrs: { href: "http://example.com" } });
    await writer.write({ type: "text", text: "🐈" });
    await writer.write({ type: "endElement", tagName: "a" });
    await writer.close();
  })();
  const result = await Array.fromAsync(readable.values());
  expect(result).toHaveLength(3);
  expect(result).toEqual([
    `<a href="http://example.com">`,
    "🐈",
    "</a>",
  ]);
});
