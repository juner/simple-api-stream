import { describe, expect, test } from "vitest";
import { SAXToXMLTextTransform } from ".";
import type { eventInterface } from ".";

test("empty chunks", async ({ expect }) => {
  const { readable, writable } = new SAXToXMLTextTransform();
  const response = new Response(readable
    .pipeThrough(new TextEncoderStream()));
  await writable.close();
  const text = await response.text();
  expect(text).toHaveLength(0);
});

describe("pattern test", (it) => {
  const entries: { name: string, input: eventInterface.SAXEventInterface[], output: string[] }[] = [
    {
      name: "html sample.",
      input: [
        { type: "startElement", tagName: "a", attrs: { href: "http://example.com" } },
        { type: "text", text: "🐈" },
        { type: "endElement", tagName: "a" },
      ],
      output: [
        `<a href="http://example.com">`,
        "🐈",
        "</a>",
      ]
    },
    {
      name: "DOCTYPE HTML 4.01 Strict",
      input: [
        { type: "doctype", root: "HTML", dtdType: "PUBLIC", identifer: "-//W3C//DTD HTML 4.01//EN", uri: "http://www.w3.org/TR/html4/strict.dtd" }
      ],
      output: [
        `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">`,
      ],
    },
    {
      name: "DOCTYPE HTML 4.01 Transitional",
      input: [
        { type: "doctype", root: "HTML", dtdType: "PUBLIC", identifer: "-//W3C//DTD HTML 4.01 Transitional//EN", uri: "http://www.w3.org/TR/html4/loose.dtd" }
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
          type: "doctype", root: "person",
          declarations: [
            `<!ELEMENT person (name, age, city)>`,
            `<!ELEMENT name (#PCDATA)>`,
            `<!ELEMENT age (#PCDATA)>`,
            `<!ELEMENT city (#PCDATA)>`,
          ],
        },
        { type: "startElement", tagName: "person", attrs: {}, selfClosing: false },
        { type: "startElement", tagName: "name", attrs: {}, selfClosing: false },
        { type: "text", text: "Alice" },
        { type: "endElement", tagName: "name" },
        { type: "startElement", tagName: "age", attrs: {}, selfClosing: false },
        { type: "text", text: "30" },
        { type: "endElement", tagName: "age" },
        { type: "startElement", tagName: "city", attrs: {}, selfClosing: false },
        { type: "text", text: "New York" },
        { type: "endElement", tagName: "city" },
        { type: "endElement", tagName: "person" },
      ]
    },
    {
      name: "INTERNAL DOCTYPE HTML",
      input: [
        { type: "doctype", dtdType: "SYSTEM", root: "myown", uri: "file:///HD/docs/dtd/myown.dtd" },
      ],
      output: [
        `<!DOCTYPE myown SYSTEM "file:///HD/docs/dtd/myown.dtd">`,
      ],
    }
  ];
  it.each(entries)(
    `$name`,
    async ({ input, output }) => {
      const { readable, writable } = new SAXToXMLTextTransform();
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
