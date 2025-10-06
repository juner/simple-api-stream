import { test, describe, expect } from "vitest";
import { XMLTextToSAXTransformStream } from "..";
import type { xml } from "..";
function collectEvents(stream: TransformStream<string, xml.eventInterfaces.SAXEventInterface>, xml: string) {
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
      switch (value.name) {
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
        case "processingInstruction":
          output.push(`processingInstruction:${value.target}:${value.data}`);
          break;
      }
    }

    return output;
  })();
}

test("SimpleSAXTransformStream parses XML stream correctly", async ({ expect }) => {
  const xml = '<!DOCTYPE root><root attr="value">text<!--comment--><![CDATA[cdata]]><child attr2="v2"/></root>';
  const stream = new XMLTextToSAXTransformStream();
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
  expect(stream.status).toEqual({
    acc: "",
    buffer: "",
    openDocumented: false,
    state: "text",
  });
});

test("SimpleSAXTransformStream handles malformed XML", async ({ expect }) => {
  const { readable, writable } = new XMLTextToSAXTransformStream();
  const writer = writable.getWriter();
  const reader = readable.getReader();
  (async () => {
    await writer.write('<tag attr=foo></tag>');
    await writer.close().catch(() => undefined);
  })();
  await expect(() => reader.read()).rejects.toThrowError("Invalid or unquoted attribute syntax near: attr=foo");
});

test("parses xml declaration and stylesheet", async ({ expect }) => {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<?xml-stylesheet type="text/xsl" href="style.xsl"?>
<root/>`;
  const stream = new XMLTextToSAXTransformStream();
  const events = await collectEvents(stream, xml);

  expect(events).toEqual([
    `processingInstruction:xml:version="1.0" encoding="UTF-8" standalone="no"`,
    `processingInstruction:xml-stylesheet:type="text/xsl" href="style.xsl"`,
    "start:root:{}:true",
    "end:root"
  ]);
});

describe("pattern test", (it) => {
  const entries: {
    name: string,
    options?: ConstructorParameters<typeof XMLTextToSAXTransformStream>[0],
    input: string[],
    output: xml.eventInterfaces.SAXEventInterface[]
  }[] = [
      {
        name: "DOCTYPE HTML 4.01 Strict",
        options: { skipDocument: true },
        input: [
          `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">`,
        ]
        , output: [
          { name: "doctype", root: "HTML", dtdType: "PUBLIC", identifer: "-//W3C//DTD HTML 4.01//EN", uri: "http://www.w3.org/TR/html4/strict.dtd" }
        ]
      },
      {
        name: "DOCTYPE HTML 4.01 Transitional",
        options: { skipDocument: true },
        input: [
          `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`,
        ],
        output: [
          { name: "doctype", root: "HTML", dtdType: "PUBLIC", identifer: "-//W3C//DTD HTML 4.01 Transitional//EN", uri: "http://www.w3.org/TR/html4/loose.dtd" }
        ]
      },
      {
        name: "DOCTYPE internal subset",
        options: { skipDocument: true },
        input: [
          `<!DOCTYPE person [
      <!ELEMENT person (name, age, city)>
      <!ELEMENT name (#PCDATA)>
      <!ELEMENT age (#PCDATA)>
      <!ELEMENT city (#PCDATA)>
    ]>
    <person><name>Alice</name><age>30</age><city>New York</city></person>`,
        ],
        output: [
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
        options: { skipDocument: true },
        input: [
          `<!doctype myown system "file:///HD/docs/dtd/myown.dtd">`,
        ],
        output: [
          { name: "doctype", dtdType: "SYSTEM", root: "myown", uri: "file:///HD/docs/dtd/myown.dtd" },
        ]
      },
      {
        name: "outputs correct XML chunks",
        options: { skipDocument: true },
        input: [`
          <root id="123">Hello &lt;world&gt; &amp; othe&#x72;&#115;<empty/><!----></root>`,
        ],
        output: [
          { name: "startElement", tagName: "root", attrs: { id: "123" }, selfClosing: false },
          { name: "text", text: "Hello <world> & others" },
          { name: "startElement", tagName: "empty", attrs: {}, selfClosing: true },
          { name: "endElement", tagName: "empty" },
          { name: "comment", comment: "" },
          { name: "endElement", tagName: "root" },
        ],
      },
      {
        name: "all type",
        input: [
          `<?xml version="1.0 ?><?xml-stylesheet type="text/xls" href="./style.xls" ?><root><![CDATA[ hoge ]]><!-- fuga --><element>piyo</element></root>`,
        ],
        output: [
          { name: "startDocument", kind: "xml" },
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
          { name: "endDocument" },
        ],
      },
      {
        name: "<?test ?>",
        input: [
          "<?test ?>",
        ],
        output: [
          { name: "startDocument", kind: "xml" },
          { name: "processingInstruction", target: "test", data: "" },
          { name: "endDocument" },
        ]
      },
      {
        name: "tag attrs",
        input: [
          `<img src='example.com/.gif' id="test" />`,
        ],
        output: [
          { name: "startDocument", kind: "xml" },
          {
            name: "startElement",
            attrs: {
              src: "example.com/.gif",
              id: "test",
            },
            tagName: "img",
            selfClosing: true
          },
          { name: "endElement", tagName: "img" },
          { name: "endDocument" },
        ]
      }
    ];
  it.each(entries)(
    `$name`,
    async ({ input, output, options }) => {
      const { readable, writable } = new XMLTextToSAXTransformStream(options);
      (async (xml, writer) => {
        for (const x of xml)
          for (const chunk of x.match(/.{1,10}/g) ?? []) {
            await writer.write(chunk);
          }
        await writer.close();
      })(input, writable.getWriter());
      const array = await Array.fromAsync(readable);
      expect(array).toEqual(output);
    }
  );
});
