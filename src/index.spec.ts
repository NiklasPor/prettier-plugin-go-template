import * as prettier from "prettier";
import * as GoTemplatePlugin from "./index";

const prettify = (code: string) =>
  prettier.format(code, {
    parser: "go-template" as any,
    plugins: [GoTemplatePlugin],
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
    expectedCode: `<p class="copyright">
  &copy; 2020 {{ .Site.Title }}. All rights reserved.
</p>
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
  {
    name: "Should Stay Multiple Lined",
    code: `<a class="image fit">
  <img src="{{ partial "get-img-src.html" (dict "image" "my-image.jpg" "context" .) }}" alt="My image" />
</a>`,
    expectedCode: `<a class="image fit">
  <img
    src="{{ partial "get-img-src.html" (dict "image" "my-image.jpg" "context" .) }}"
    alt="My image"
  />
</a>
`,
  },
  {
    name: "Small Content Should Stay Single Lined",
    code: `<meta property="twitter:url" content="{{ }}" />`,
    expectedCode: `<meta property="twitter:url" content="{{ }}" />
`,
  },
  {
    name: "Long Content Should Be Split Up By Attribute",
    code: `<meta property="twitter:url" content="{{ strings.TrimSuffix "/" .Permalink }}" />`,
    expectedCode: `<meta
  property="twitter:url"
  content="{{ strings.TrimSuffix "/" .Permalink }}"
/>
`,
  },
  {
    name: "Single Lines Should Not Be Concatenated",
    code: `<link rel="apple-touch-icon" sizes="180x180" href="{{ (resources.Get "apple-touch-icon.png" | fingerprint).RelPermalink }}" />
    <link rel="icon" type="image/x-icon" href="{{ (resources.Get "favicon.ico" | fingerprint).RelPermalink }}" />
    <link rel="icon" type="image/png" sizes="32x32" href="{{ (resources.Get "favicon-32x32.png" | fingerprint).RelPermalink }}" />`,
    expectedCode: `<link
  rel="apple-touch-icon"
  sizes="180x180"
  href="{{ (resources.Get "apple-touch-icon.png" | fingerprint).RelPermalink }}"
/>
<link
  rel="icon"
  type="image/x-icon"
  href="{{ (resources.Get "favicon.ico" | fingerprint).RelPermalink }}"
/>
<link
  rel="icon"
  type="image/png"
  sizes="32x32"
  href="{{ (resources.Get "favicon-32x32.png" | fingerprint).RelPermalink }}"
/>
`,
  },
  {
    name: "No Unnecessary Newlines",
    code: `{{ $sassOptions := (dict "targetPath" "css/main.css" "outputStyle" (cond .Site.Params.Minify "compressed" "expanded") "enableSourceMap" (not hugo.IsProduction)) }}
{{ $css := resources.Match "sass/*.scss" | resources.Concat "" | resources.ExecuteAsTemplate "" . | toCSS $sassOptions }}
{{ if $.Site.Params.Minify }}
{{ $css = $css | fingerprint "sha512" }}
{{ end }}
<link rel="stylesheet" href="{{ $css.RelPermalink }}" integrity="{{ $css.Data.Integrity }}" />

<link rel="preconnect" href="https://www.google-analytics.com" />
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-160619965-1"></script>
{{ $analytics := resources.Get "js/analytics.js" | babel (dict "config" "babel.config.json" "verbose" true) | minify | fingerprint "sha512" }}
{{ if ne $analytics.Data.Integrity "sha512-0LVjmruu9Umzscdy8OR21j2JModpt/NfJnMnR82jGVQXBeamQnJMZIw97GTyxA/Ul0rjS8wfva5wcAPedlE+Zw==" }}
{{ errorf "analytics.js has a new SHA: %q" $analytics.Data.Integrity }}
{{ end }}

<script>
  {{ $analytics.Content | safeJS }}
</script>
`,
    expectedCode: `{{ $sassOptions := (dict "targetPath" "css/main.css" "outputStyle" (cond .Site.Params.Minify "compressed" "expanded") "enableSourceMap" (not hugo.IsProduction)) }}
{{ $css := resources.Match "sass/*.scss" | resources.Concat "" | resources.ExecuteAsTemplate "" . | toCSS $sassOptions }}
{{ if $.Site.Params.Minify }}
{{ $css = $css | fingerprint "sha512" }}
{{ end }}
<link
  rel="stylesheet"
  href="{{ $css.RelPermalink }}"
  integrity="{{ $css.Data.Integrity }}"
/>

<link rel="preconnect" href="https://www.google-analytics.com" />
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=UA-160619965-1"
></script>
{{ $analytics := resources.Get "js/analytics.js" | babel (dict "config" "babel.config.json" "verbose" true) | minify | fingerprint "sha512" }}
{{ if ne $analytics.Data.Integrity "sha512-0LVjmruu9Umzscdy8OR21j2JModpt/NfJnMnR82jGVQXBeamQnJMZIw97GTyxA/Ul0rjS8wfva5wcAPedlE+Zw==" }}
{{ errorf "analytics.js has a new SHA: %q" $analytics.Data.Integrity }}
{{ end }}

<script>
  {{ $analytics.Content | safeJS }}
</script>
`,
  },
  {
    name: "Bracket Spacing",
    code: `{{   define "some"}}
{{   . }}
{{end}} `,
    expectedCode: `{{ define "some" }}
{{ . }}
{{ end }}
`,
  },
  {
    name: "Bracket Spacing with Hyphens",
    code: `{{-  define "some"-}}
{{   . }}
{{-end-}} `,
    expectedCode: `{{- define "some" -}}
{{ . }}
{{- end -}}
`,
  },
];

tests.forEach((test) =>
  it(test.name, () => {
    const formatted = prettify(test.code);

    expect(formatted).toEqual(test.expectedCode);
  })
);
