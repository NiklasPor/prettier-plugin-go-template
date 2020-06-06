import * as prettier from "prettier";

const prettify = (code: string) =>
  prettier.format(code, {
    parser: "go-template" as any,
    plugins: ["lib"],
  });

interface CodeTestCase {
  name: string;
  code: string;
  expectedCode: string;
}

const tests: CodeTestCase[] = [
  {
    name: "Simple Template",
    code: `{{ define "page" }}
This is an article. <br />
{{ . }}
{{ end }}       
`,
    expectedCode: `{{ define "page" }}
This is an article. <br />
{{ . }}
{{ end }}
`,
  },
  {
    name: "Basic Template",
    code: `{{ define "page" }}
This is an article. Name: {{ .article.name }}
{{ end }}`,
    expectedCode: `{{ define "page" }}
This is an article. Name:
{{ .article.name }}
{{ end }}
`,
  },
  {
    name: "Duplicate Without Space",
    code: `{{ define "page" }}{{ .article.name }}`,
    expectedCode: `{{ define "page" }}
{{ .article.name }}
`,
  },
  {
    name: "Multiple Single Line Statements",
    code: `<img class="{{ if eq $index 1 }} row-span-1 {{ else }} row-span-2 {{ end }}"/>`,
    expectedCode: `<img class="{{ if eq $index 1 }} row-span-1 {{ else }} row-span-2 {{ end }}" />
`,
  },
];

tests.forEach((test) =>
  it(test.name, () => {
    const formatted = prettify(test.code);

    expect(formatted).toEqual(test.expectedCode);
  })
);
