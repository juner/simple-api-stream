import { test,vi } from "vitest";
import { SimpleSAXWritableStream, type SimpleSAXHandler } from ".";

test("parses start and end tags with attributes", async ({ expect }) => {
  const events: string[] = [];
  const handler: SimpleSAXHandler = {
    onStartElement(name, attrs, selfClosing) {
      events.push(`start:${name}:${JSON.stringify(attrs)}:${selfClosing}`);
    },
    onEndElement(name) {
      events.push(`end:${name}`);
    },
    onText(text) {
      events.push(`text:${text}`);
    },
    onError(err) {
      events.push(`error:${err.message}`);
    }
  };

  const xml = '<root attr="value">text<child attr2="v2"/></root>';
  const stream = new SimpleSAXWritableStream(handler);
  const writer = stream.getWriter();
  await writer.write(xml);
  await writer.close();

  expect(events).toEqual([
    'start:root:{"attr":"value"}:false',
    'text:text',
    'start:child:{"attr2":"v2"}:true',
    'end:child',
    'end:root'
  ]);
});

test("handles malformed XML gracefully", async ({ expect }) => {
  const handler: SimpleSAXHandler = {
    onError: vi.fn()
  };
  const stream = new SimpleSAXWritableStream(handler);
  await stream.getWriter().abort("bad xml");
  expect(handler.onError).toHaveBeenCalledWith(expect.any(Error));
});

test("handles only text nodes", async ({ expect }) => {
  const handler: SimpleSAXHandler = {
    onText: vi.fn()
  };
  const stream = new SimpleSAXWritableStream(handler);
  const writer = stream.getWriter();
  await writer.write("   just text   ");
  await writer.close();
  expect(handler.onText).toHaveBeenCalledWith("just text");
});
