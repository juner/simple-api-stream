import { test, describe, expect } from "vitest";
import { XMLTextToSimpleSAXTransformStream } from ".";
import type { eventInterface } from ".";
function collectEvents(stream: TransformStream<string, eventInterface.SAXEventInterface>, xml: string) {
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
        case "doctype":
          if (value.dtdType === "PUBLIC")
            output.push(`doctype:${value.root}:${value.dtdType}:${value.identifer}:${value.uri}:${value.declarations ?? ""}`);
          else if (value.dtdType === "SYSTEM")
            output.push(`doctype:${value.root}:${value.dtdType}:${value.uri}:${value.declarations ?? ""}`);
          else
            output.push(`doctype:${value.root}:${value.declarations ?? ""}`);
          break;
        case "xmlDeclaration":
          output.push(`xmlDeclaration:${value.version}:${value.encoding}:${value.standalone}`);
          break;
        case "displayingXML":
          output.push(`displayingXML:${value.contentType}:${value.href}`);
          break;
      }
    }

    return output;
  })();
}

test("SimpleSAXTransformStream parses XML stream correctly", async ({ expect }) => {
  const xml = '<!DOCTYPE root><root attr="value">text<!--comment--><![CDATA[cdata]]><child attr2="v2"/></root>';
  const stream = new XMLTextToSimpleSAXTransformStream();
  const events = await collectEvents(stream, xml);

  expect(events).toEqual([
    'doctype:root:',
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
  const { readable, writable } = new XMLTextToSimpleSAXTransformStream();
  const writer = writable.getWriter();
  const reader = readable.getReader();
  (async () => {
    await writer.write('<tag attr=foo></tag>');
    await writer.close().catch(() => undefined);
  })();
  await expect(() => reader.read()).rejects.toThrowError("Invalid or unquoted attribute syntax near: attr=foo");
});

test("parses xml declaration and stylesheet", async ({ expect }) => {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl" href="style.xsl"?>
<root/>`;
  const stream = new XMLTextToSimpleSAXTransformStream();
  const events = await collectEvents(stream, xml);

  expect(events).toEqual([
    "xmlDeclaration:1.0:UTF-8:yes",
    "displayingXML:text/xsl:style.xsl",
    "start:root:{}:true",
    "end:root"
  ]);
});

test("parses DOCTYPE with internal subset", async ({ expect }) => {
  const xml = `<!DOCTYPE person [
    <!ELEMENT person (name, age, city)>
    <!ELEMENT name (#PCDATA)>
    <!ELEMENT age (#PCDATA)>
    <!ELEMENT city (#PCDATA)>
  ]>
  <person><name>Alice</name><age>30</age><city>New York</city></person>`;

  const stream = new XMLTextToSimpleSAXTransformStream();
  const events = await collectEvents(stream, xml);
  expect(events[0]).toEqual(
    expect.stringMatching(/^doctype:person:/));

  expect(events.slice(1)).toEqual([
    "start:person:{}:false",
    "start:name:{}:false",
    "text:Alice",
    "end:name",
    "start:age:{}:false",
    "text:30",
    "end:age",
    "start:city:{}:false",
    "text:New York",
    "end:city",
    "end:person"
  ]);
});
describe("pattern test", (it) => {
  const doctypes: { name: string, input: string, output: eventInterface.SAXEventInterface[] }[] = [

    {
      name: "HTML 4.01 Strict",
      input: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">`,
      output: [
        { type: "doctype", root: "HTML", dtdType: "PUBLIC", identifer: "-//W3C//DTD HTML 4.01//EN", uri: "http://www.w3.org/TR/html4/strict.dtd" }
      ]
    },
    {
      name: "HTML 4.01 Transitional",
      input: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`,
      output: [
        { type: "doctype", root: "HTML", dtdType: "PUBLIC", identifer: "-//W3C//DTD HTML 4.01 Transitional//EN", uri: "http://www.w3.org/TR/html4/loose.dtd" }
      ]
    },
    {
      name: "DOCTYPE internal subset",
      input: `<!DOCTYPE person [
      <!ELEMENT person (name, age, city)>
      <!ELEMENT name (#PCDATA)>
      <!ELEMENT age (#PCDATA)>
      <!ELEMENT city (#PCDATA)>
    ]>
    <person><name>Alice</name><age>30</age><city>New York</city></person>`,
      output: [
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
      input: `<!doctype myown system "file:///HD/docs/dtd/myown.dtd">`,
      output: [
        { type: "doctype", dtdType: "SYSTEM", root: "myown", uri: "file:///HD/docs/dtd/myown.dtd" },
      ]
    }
  ];
  it.each(doctypes)(
    `pass DOCTYPE $name`,
    async ({ input, output }) => {
      const { readable, writable } = new XMLTextToSimpleSAXTransformStream();
      (async (xml, writer) => {
        for (const chunk of xml.match(/.{1,10}/g) ?? []) {
          await writer.write(chunk);
        }
        await writer.close();
      })(input, writable.getWriter());
      const array = await Array.fromAsync(readable);
      expect(array).toEqual(output);
    }
  );
});
