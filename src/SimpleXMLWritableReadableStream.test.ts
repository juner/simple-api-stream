import { test } from "vitest";
import { SimpleXMLWritableReadableStream } from ".";

test("empty chunks", async ({expect}) => {
  const stream = new SimpleXMLWritableReadableStream();
  const response = new Response(stream.pipeThrough(new TextEncoderStream()));
  stream.end();
  const text = await response.text();
  expect(text).toHaveLength(0);
});

test("outputs correct XML chunks", async ({ expect }) => {
  const stream = new SimpleXMLWritableReadableStream();
  const reader = stream.getReader();

  stream.startElement("root", { id: "123" });
  stream.text("Hello <world> & others");
  stream.startElement("empty", {}, true);
  stream.endElement("root");
  stream.end();

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
