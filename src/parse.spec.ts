import { GoBlock, GoDoubleBlock, GoRoot } from "./parse";
import { parseGoTemplate } from "./parse";
import * as id from "./create-id-generator";
describe("parseGoTemplate", () => {
  beforeEach(() => {
    let i = 0;
    jest
      .spyOn(id, "createIdGenerator")
      .mockImplementation(() => () => `UUID${i++}`);
  });

  it("should parse nested template", () => {
    const input = `<div {{< this is inline >}}>
{{ define whatever }}
<span>
{{ if inner }}
<img src="{{ .content }}" />
{{ end }}
</span>
{{ end }}
</div>`;

    const expected: GoRoot = {
      type: "root",
      contentStart: 0,
      index: 0,
      length: 136,
      content: expect.anything(),
      aliasedContent: `<div UUID0>
UUID1
</div>`,
      children: {
        UUID0: {
          id: "UUID0",
          type: "inline",
          startDelimiter: "<",
          endDelimiter: ">",
          statement: "this is inline",
          index: 5,
          length: 22,
          parent: expect.anything(),
        },
        UUID1: {
          id: "UUID1",
          type: "block",
          keyword: "define",
          statement: "define whatever",
          contentStart: 50,
          index: 29,
          length: 100,
          parent: expect.anything(),
          content: expect.anything(),
          aliasedContent: `
<span>
UUID2
</span>
`,
          children: {
            UUID2: {
              id: "UUID2",
              type: "block",
              keyword: "if",
              statement: "if inner",
              contentStart: 72,
              index: 58,
              length: 53,
              parent: expect.anything(),
              content: expect.anything(),
              aliasedContent: `
<img src="UUID3" />
`,
              children: {
                UUID3: {
                  id: "UUID3",
                  type: "inline",
                  statement: ".content",
                  startDelimiter: "",
                  endDelimiter: "",
                  index: 83,
                  length: 14,
                  parent: expect.anything(),
                },
              },
            },
          },
        },
      },
    };

    const result = parseGoTemplate(input, {}, {} as any);

    expect(result).toStrictEqual(expected);
  });

  it("should parse if else template", () => {
    const input = `{{ if }}
  <span>If Content</span>
{{ else }}
  <span>{{ . }}</span>
{{ end }}`;

    const expected: GoRoot = {
      type: "root",
      contentStart: 0,
      index: 0,
      length: 78,
      content: expect.anything(),
      aliasedContent: `UUID0`,
      children: {
        UUID0: {
          id: "UUID0",
          type: "double-block",
          parent: expect.anything(),
          index: 0,
          length: 78,
          keyword: "else",
          statement: "else",
          firstChild: {
            id: "UUID2",
            type: "block",
            keyword: "if",
            statement: "if",
            contentStart: 8,
            index: 0,
            length: 45,
            parent: expect.anything(),
            content: expect.anything(),
            aliasedContent: `
  <span>If Content</span>
`,
            children: {},
          },
          secondChild: {
            id: "UUID1",
            type: "block",
            keyword: "else",
            statement: "else",
            contentStart: 45,
            index: 35,
            length: 43,
            parent: expect.anything(),
            content: expect.anything(),
            aliasedContent: `
  <span>UUID3</span>
`,
            children: {
              UUID3: {
                type: "inline",
                id: "UUID3",
                startDelimiter: "",
                endDelimiter: "",
                index: 54,
                length: 7,
                statement: ".",
                parent: expect.anything(),
              },
            },
          },
        },
      },
    };

    const result = parseGoTemplate(input, {}, {} as any);

    expect(result).toStrictEqual(expected);
  });
});
