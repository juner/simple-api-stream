import { test } from "vitest";
import { SimpleSAXTransformStream } from ".";
import type { SAXEventInterface } from ".";

function collectEvents(stream: TransformStream<string, SAXEventInterface>, xml: string) {
  const reader = stream.readable.getReader();
  const writer = stream.writable.getWriter();
  const output: string[] = [];

  return (async () => {
    (async () => {
      for (const chunk of xml.match(/.{1,10}/g) ?? []) {
        await writer.write(chunk);
      }
      await writer.close();
    })();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      switch (value.type) {
        case "startElement":
          output.push(`start:${value.tagName}:${JSON.stringify(value.attrs)}:${value.selfClosing}`);
          break;
        case "endElement":
          output.push(`end:${value.tagName}`);
          break;
        case "text":
          output.push(`text:${value.text}`);
          break;
        case "comment":
          output.push(`comment:${value.comment}`);
          break;
        case "cdata":
          output.push(`cdata:${value.cdata}`);
          break;
        case "dtd":
          output.push(`dtd:${value.dtd}`);
          break;
      }
    }

    return output;
  })();
}

test("SimpleSAXTransformStream parses XML stream correctly", async ({ expect }) => {
  const xml = '<!DOCTYPE hoge><root attr="value">text<!--comment--><![CDATA[cdata]]><child attr2="v2"/></root>';
  const stream = new SimpleSAXTransformStream();
  const events = await collectEvents(stream, xml);

  expect(events).toEqual([
    'dtd:<!DOCTYPE hoge>',
    'start:root:{"attr":"value"}:false',
    'text:text',
    'comment:comment',
    'cdata:cdata',
    'start:child:{"attr2":"v2"}:true',
    'end:child',
    'end:root'
  ]);
});

test("SimpleSAXTransformStream handles malformed XML", async ({ expect }) => {
  const { readable, writable } = new SimpleSAXTransformStream();
  const writer = writable.getWriter();
  const reader = readable.getReader();
  (async () => {
    await writer.write('<tag attr=foo></tag>');
    await writer.close();
  })();
  expect(() => reader.read()).rejects.toThrowError("Invalid or unquoted attribute syntax near: attr=foo");
});
