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
    name: "Simple Template + Value after Variable",
    code: `{{ define "page" }} This is an article. <br />
{{ . }}
{{ end }}       
`,
    expectedCode: `{{ define "page" }} This is an article. <br />
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
This is an article. Name: {{ .article.name }}
{{ end }}
`,
  },
  {
    name: "Duplicate Without Space",
    code: `{{ define "page" }}{{ .article.name }}`,
    expectedCode: `{{ define "page" }}{{ .article.name }}
`,
  },
  {
    name: "Multiple Single Line Statements",
    code: `<img class="{{ if eq $index 1 }} row-span-1 {{ else }} row-span-2 {{ end }}"/>`,
    expectedCode: `<img class="{{ if eq $index 1 }} row-span-1 {{ else }} row-span-2 {{ end }}" />
`,
  },
  {
    name: "Attribute Replacement",
    code: `<meta property="og:url" content="{{ strings.TrimSuffix "/" .Permalink }}" />`,
    expectedCode: `<meta property="og:url" content="{{ strings.TrimSuffix "/" .Permalink }}" />
`,
  },
  {
    name: "Plain Text Inline Replacement Long String",
    code: `<p class="copyright">
    &copy; 2020 {{ .Site.Title }}. All rights reserved for everyone sometimes.
</p>`,
    expectedCode: `<p class="copyright">
  &copy; 2020 {{ .Site.Title }}. All rights reserved for everyone sometimes.
</p>
`,
  },
  {
    name: "Plain Text Inline Replacement Short String",
    code: `<p class="copyright">
    &copy; 2020 {{ .Site.Title }}. All rights reserved.
</p>`,
    expectedCode: `<p class="copyright">&copy; 2020 {{ .Site.Title }}. All rights reserved.</p>
`,
  },
  {
    name: "Plain Text No Variable",
    code: `<p class="copyright">
  &copy; 2020 All <strong>f</strong>rights reserved.
</p>`,
    expectedCode: `<p class="copyright">&copy; 2020 All <strong>f</strong>rights reserved.</p>
`,
  },
];

tests.forEach((test) =>
  it(test.name, () => {
    const formatted = prettify(test.code);

    expect(formatted).toEqual(test.expectedCode);
  })
);
