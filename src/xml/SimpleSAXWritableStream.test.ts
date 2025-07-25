import { test,vi } from "vitest";
import { SimpleSAXWritableStream } from "..";
import type { SimpleSAXHandler } from "..";
import { TextEvent } from "./event/TextEvent";

test("parses start and end tags with attributes", async ({ expect }) => {
  const events: string[] = [];
  const handler: SimpleSAXHandler = {
    onStartElement({tagName, attrs, selfClosing}) {
      events.push(`start:${tagName}:${JSON.stringify(attrs)}:${selfClosing}`);
    },
    onEndElement({tagName}) {
      events.push(`end:${tagName}`);
    },
    onText({text}) {
      events.push(`text:${text}`);
    },
    onError(err) {
      events.push(`error:${(err as {message?:string}).message ?? err}`);
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
  expect(handler.onText).toHaveBeenCalledWith(new TextEvent("just text"));
});

test("handles missing handlers gracefully", async ({ expect }) => {
  const handler: SimpleSAXHandler = {}; // すべて未定義
  const stream = new SimpleSAXWritableStream(handler);
  const writer = stream.getWriter();
  await writer.write('<a attr="1"/>SomeText</a>');
  await writer.close();
  expect(true).toBe(true); // エラーが出なければOK
});

test("handles malformed attributes and catches errors", async ({ expect }) => {
  const handler: SimpleSAXHandler = {
    onError: vi.fn()
  };
  const stream = new SimpleSAXWritableStream(handler);

  // 属性が正しくない（クォートなし）
  const writer = stream.getWriter();
  await writer.write('<tag attr=foo></tag>');
  await writer.close();

  expect(handler.onError).toHaveBeenCalledWith(expect.any(Error));
});

test("parseBuffer throws synchronously in write and handled in onError", async ({ expect }) => {
  const handler: SimpleSAXHandler = {
    onError: vi.fn(),
    onStartElement() {
      throw new Error("handler error");
    }
  };
  const stream = new SimpleSAXWritableStream(handler);
  await stream.getWriter().write("<test/>");
  expect(handler.onError).toHaveBeenCalledWith(expect.objectContaining({ message: "handler error" }));
});
