import { test } from "vitest";
import { ResolveToSimpleSAXReadableStream } from ".";

test("empty chunks", async ({ expect }) => {
  const stream = new ResolveToSimpleSAXReadableStream();
  const response = new Response(stream.pipeThrough(new TextEncoderStream()));
  stream.close();
  const text = await response.text();
  expect(text).toHaveLength(0);
});

test("outputs correct XML chunks", async ({ expect }) => {
  const stream = new ResolveToSimpleSAXReadableStream();
  const reader = stream.getReader();

  stream.startElement("root", { id: "123" }, false);
  stream.text("Hello <world> & others");
  stream.startElement("empty", {}, true);
  stream.endElement("root");
  stream.close();

  const chunks: string[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value!);
  }

  expect(chunks).toEqual([
    '<root id="123">',
    'Hello &lt;world&gt; &amp; others',
    '<empty/>',
    '</root>'
  ]);
});

test("handles empty text and attributes", async ({ expect }) => {
  const stream = new ResolveToSimpleSAXReadableStream();
  const reader = stream.getReader();

  stream.startElement("x", {}, false);
  stream.text("");
  stream.endElement("x");
  stream.close();

  const out: string[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    out.push(value!);
  }

  expect(out).toEqual(["<x>", "", "</x>"]);
});

test("correctly escapes quotes in attribute values", async ({ expect }) => {
  const stream = new ResolveToSimpleSAXReadableStream();
  const reader = stream.getReader();

  stream.startElement("item", { title: 'He said "hi" & <bye>' }, true);
  stream.close();

  const result: string[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result.push(value!);
  }

  expect(result).toEqual(['<item title="He said &quot;hi&quot; &amp; &lt;bye&gt;"/>']);
});
