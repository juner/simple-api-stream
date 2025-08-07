import { describe, expect, test } from "vitest";
import { SAXToXMLTextTransform } from "..";
import type { xml } from "..";
test("empty chunks", async ({ expect }) => {
  const { readable, writable } = new SAXToXMLTextTransform();
  const response = new Response(readable
    .pipeThrough(new TextEncoderStream()));
  await writable.close();
  const text = await response.text();
  expect(text).toHaveLength(0);
});

describe("error pattern", (it) => {
  it.concurrent("not complete", async ({ expect }) => {
    const {readable, writable} = new SAXToXMLTextTransform();
    const write = (async () => {
      const writer = writable.getWriter();
      await writer.write({name: "startElement", tagName: "a"});
      await writer.close();
    })();
    const read = (async () => {
      return await Array.fromAsync(readable);
    })();
    await expect(write).rejects.toThrowError("not complete error.");
    await expect(read).rejects.toThrowError("not complete error.");
  });
});

describe("pattern test", (it) => {
  const entries: {
    name: string,
    options?: ConstructorParameters<typeof SAXToXMLTextTransform>[0];
    input: xml.eventInterfaces.SAXEventInterface[],
    output: string[]
  }[] = [
      {
        name: "html sample.",
        options: { indent: `\t`, lineBreak: `\n` },
        input: [
          { name: "startElement", tagName: "a", attrs: { href: "http://example.com" } },
          { name: "text", text: "🐈" },
          { name: "endElement", tagName: "a" },
        ],
        output: [
          `<a href="http://example.com">\n`,
          "\t🐈\n",
          "</a>\n",
        ]
      },
      {
        name: "DOCTYPE HTML 4.01 Strict",
        input: [
          { name: "doctype", root: "HTML", dtdType: "PUBLIC", identifer: "-//W3C//DTD HTML 4.01//EN", uri: "http://www.w3.org/TR/html4/strict.dtd" }
        ],
        output: [
          `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">`,
        ],
      },
      {
        name: "DOCTYPE HTML 4.01 Transitional",
        input: [
          { name: "doctype", root: "HTML", dtdType: "PUBLIC", identifer: "-//W3C//DTD HTML 4.01 Transitional//EN", uri: "http://www.w3.org/TR/html4/loose.dtd" }
        ],
        output: [
          `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`,
        ],
      },
      {
        name: "DOCTYPE internal subset",
        output: [
          `<!DOCTYPE person [ <!ELEMENT person (name, age, city)><!ELEMENT name (#PCDATA)><!ELEMENT age (#PCDATA)><!ELEMENT city (#PCDATA)>]>`,
          `<person>`,
          `<name>`,
          `Alice`,
          `</name>`,
          `<age>`,
          `30`,
          `</age>`,
          `<city>`,
          `New York`,
          `</city>`,
          `</person>`,
        ],
        input: [
          {
            name: "doctype", root: "person",
            declarations: [
              `<!ELEMENT person (name, age, city)>`,
              `<!ELEMENT name (#PCDATA)>`,
              `<!ELEMENT age (#PCDATA)>`,
              `<!ELEMENT city (#PCDATA)>`,
            ],
          },
          { name: "startElement", tagName: "person", attrs: {}, selfClosing: false },
          { name: "startElement", tagName: "name", attrs: {}, selfClosing: false },
          { name: "text", text: "Alice" },
          { name: "endElement", tagName: "name" },
          { name: "startElement", tagName: "age", attrs: {}, selfClosing: false },
          { name: "text", text: "30" },
          { name: "endElement", tagName: "age" },
          { name: "startElement", tagName: "city", attrs: {}, selfClosing: false },
          { name: "text", text: "New York" },
          { name: "endElement", tagName: "city" },
          { name: "endElement", tagName: "person" },
        ]
      },
      {
        name: "INTERNAL DOCTYPE HTML",
        input: [
          { name: "doctype", dtdType: "SYSTEM", root: "myown", uri: "file:///HD/docs/dtd/myown.dtd" },
        ],
        output: [
          `<!DOCTYPE myown SYSTEM "file:///HD/docs/dtd/myown.dtd">`,
        ],
      },
      {
        name: "correctly escapes quotes in attribute values",
        input: [
          { name: "startElement", tagName: "item", attrs: { title: 'He said "hi" & <bye>' }, selfClosing: true },
          { name: "endElement", tagName: "item" },
        ],
        output: [
          '<item title="He said &quot;hi&quot; &amp; &lt;bye&gt;"/>',
        ]
      },
      {
        name: "outputs correct XML chunks",
        input: [
          { name: "startElement", tagName: "root", attrs: { id: "123" } },
          { name: "text", text: "'Hello <world> & others'" },
          { name: "startElement", tagName: "empty", selfClosing: true },
          { name: "endElement", tagName: "empty" },
          { name: "comment", comment: "" },
          { name: "endElement", tagName: "root" },
        ],
        output: [
          '<root id="123">',
          '&#39;Hello &lt;world&gt; &amp; others&#39;',
          '<empty/>',
          '<!---->',
          '</root>'
        ],
      }, {
        name: "all type",
        input: [
          {
            data: `version="1.0" encoding="UTF-8"`,
            encoding: "UTF-8",
            standalone: "yes",
            target: "xml",
            name: "processingInstruction",
            version: "1.0",
          },
          {
            type: "text/xls",
            data: `type="text/xls" href="./style.xls"`,
            href: "./style.xls",
            target: "xml-stylesheet",
            name: "processingInstruction",
          },
          {
            attrs: {},
            selfClosing: false,
            tagName: "root",
            name: "startElement",
          },
          {
            cdata: " hoge ",
            name: "cdata",
          }, {
            comment: " fuga ",
            name: "comment",
          }, {
            attrs: {},
            selfClosing: false,
            tagName: "element",
            name: "startElement",
          }, {
            text: "piyo",
            name: "text",
          }, {
            tagName: "element",
            name: "endElement",
          }, {
            tagName: "root",
            name: "endElement",
          },
        ],
        output: [
          `<?xml version="1.0" encoding="UTF-8" ?>`,
          `<?xml-stylesheet type="text/xls" href="./style.xls" ?>`,
          `<root>`,
          `<![CDATA[ hoge ]]>`,
          `<!-- fuga -->`,
          `<element>`,
          `piyo`,
          `</element>`,
          `</root>`
        ],
      }
    ];
  it.each(entries)(
    `$name`,
    async ({ options, input, output }) => {
      const { readable, writable } = new SAXToXMLTextTransform(options);
      (async (input, writer) => {
        for (const i of input)
          await writer.write(i);
        await writer.close();
      })(input, writable.getWriter());
      const result = await Array.fromAsync(readable.values());
      expect(result).toEqual(output);
    }
  );
});
