import { describe, expect, test } from "vitest";
import { ResolveToSAXReadableStream, SAXToXMLTextTransform } from "..";
import type { xml } from "..";

test("empty chunks", async ({ expect }) => {
  const stream = new ResolveToSAXReadableStream();
  const response = new Response(stream
    .pipeThrough(new SAXToXMLTextTransform())
    .pipeThrough(new TextEncoderStream()));
  stream.close();
  const text = await response.text();
  expect(text).toHaveLength(0);
});

test("outputs correct XML chunks", async ({ expect }) => {
  const stream = new ResolveToSAXReadableStream();
  const reader = stream
    .pipeThrough(new SAXToXMLTextTransform())
    .getReader();

  stream.startElement("root", { id: "123" }, false);
  stream.text("Hello <world> & others");
  stream.startElement("empty", {}, true);
  stream.endElement("empty");
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
  const stream = new ResolveToSAXReadableStream();
  const reader = stream
    .pipeThrough(new SAXToXMLTextTransform())
    .getReader();

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

describe("pattern", (it) => {
  const entries: {
    name: string;
    input: ((stream: InstanceType<typeof ResolveToSAXReadableStream>) => void)[];
    output: xml.eventInterface.SAXEventInterface[];
  }[] = [
      {
        name: "all type",
        input: [
          stream => stream.processingInstruction({ target: "xml", version: "1.0", encoding: "UTF-8" }),
          stream => stream.processingInstruction({ target: "xml-stylesheet", contentType: `text/xls`, href: `./style.xls` }),
          stream => stream.startElement("root"),
          stream => stream.cdata(" hoge "),
          stream => stream.comment(" fuga "),
          stream => stream.startElement("element"),
          stream => stream.text("piyo"),
          stream => stream.endElement("element"),
          stream => stream.endElement("root"),
        ],
        output: [
          {
            "data": `version="1.0" encoding="UTF-8"`,
            "encoding": "UTF-8",
            "standalone": "yes",
            "target": "xml",
            "type": "processingInstruction",
            "version": "1.0",
          },
          {
            "contentType": "text/xls",
            "data": `type="text/xls" href="./style.xls"`,
            "href": "./style.xls",
            "target": "xml-stylesheet",
            "type": "processingInstruction",
          },
          {
            "attrs": {},
            "selfClosing": false,
            "tagName": "root",
            "type": "startElement",
          },
          {
            "cdata": " hoge ",
            "type": "cdata",
          },
          {
            "comment": " fuga ",
            "type": "comment",
          },
          {
            "attrs": {},
            "selfClosing": false,
            "tagName": "element",
            "type": "startElement",
          },
          {
            "text": "piyo",
            "type": "text",
          },
          {
            "tagName": "element",
            "type": "endElement",
          },
          {
            "tagName": "root",
            "type": "endElement",
          },
        ],
      }
    ];
  it.each(entries)("$name", async ({ input, output }) => {
    const stream = new ResolveToSAXReadableStream();
    for (const i of input)
      i(stream);
    stream.close();
    const result = await Array.fromAsync(stream);
    expect(result).toEqual(output);
  });
});
