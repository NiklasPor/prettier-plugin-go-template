# prettier-plugin-go-template

[![NPM Badge](https://img.shields.io/npm/v/prettier-plugin-go-template)](https://www.npmjs.com/package/prettier-plugin-go-template) [![CodeCov Badge](https://img.shields.io/codecov/c/github/niklaspor/prettier-plugin-go-template)](https://codecov.io/gh/NiklasPor/prettier-plugin-go-template) [![Contributions Badge](https://img.shields.io/github/all-contributors/niklaspor/prettier-plugin-go-template)](#contributors-)

Formatter plugin for go template files. The only peer dependency is [prettier](https://www.npmjs.com/package/prettier). Test you own code on the [**playground**](https://prettier-plugin-go-template-playground.niklaspor.dev/).

```bash
npm install --save-dev prettier prettier-plugin-go-template
```

or see [VSCode](#vscode) if you want to use this with vscode

The following file types are detected automatically:
`.gohtml`, `.gotmpl`, `.go.tmpl`, `.tmpl`, `.tpl`, `.html.tmpl`

<table>
<tr>
<th>Input</th>
<th>Output</th>
</tr>
<tr>
<td>

<!-- prettier-ignore-start -->
```html
{{ if or .Prev .Next -}}
{{ $p := where site.Pages }}
<div class="my-navigation">
{{ with $p.Next . -}}
<a href="{{ .RelPermalink }}">
<div class="row">
<div class="cell py-2">
  {{ .Title }} 
</div> </div> </a>
{{ end -}}
</div>
{{ end -}}
```
<!-- prettier-ignore-end -->

</td>
<td>

<!-- prettier-ignore-start -->
```html
{{ if or .Prev .Next -}}
  {{ $p := where site.Pages }}
  <div class="my-navigation">
    {{ with $p.Next . -}}
      <a href="{{ .RelPermalink }}">
        <div class="row">
          <div class="cell py-2">{{ .Title }}</div>
        </div>
      </a>
    {{ end -}}
  </div>
{{ end -}}
```
<!-- prettier-ignore-end -->

</td>
</tr>
</table>

## GoHugo / `.html`

To use it with GoHugo and basic `.html` files, you'll have to override the used parser inside your `.prettierrc` file:

```json
{
  "overrides": [
    {
      "files": ["*.html"],
      "options": {
        "parser": "go-template"
      }
    }
  ]
}

```

## VSCode

Steps:

0. Have node & npm installed
1. Run `npm i -g prettier prettier-plugin-go-template`
2. Find where your node modules are by running `npm root -g` ➡️ `/Users/niklaspor/.nvm/versions/node/v16.13.2/lib/node_modules`
3. Configure your VSCode settings to use your global prettier: `"prettier.prettierPath": "/Users/niklaspor/.nvm/versions/node/v16.13.2/lib/node_modules/prettier"`
4. Copy [this code block](#gohugo--html) to your css config
5. Set prettier as your default formatter for html or select format the document with prettier to use the plugin

> Note: The global setup additional requires setting your VSCode prettier path to your global prettier path. You can read more in [this issue](https://github.com/NiklasPor/prettier-plugin-go-template/issues/58#issuecomment-1085060511) about how to set it up.

## Additional Options

```js
// .prettierrc
{
  /**
   * Enables & disables spacing between go statements.
   * E.g. {{ statement }} vs {{statement}}.
   * Default: true
   */
  "goTemplateBracketSpacing": true
}
```

## Ignoring Code

#### Single Block

```html
<div>
  <!-- prettier-ignore -->
  {{if }}
  {{end }}
</div>
```

#### Multiline

```html
<html>
  {{/* prettier-ignore-start */}}
  <script>
    {{if }}
    Whatever.
    {{else }}
    Psych.
    {{end }}
  </script>
  {{/* prettier-ignore-end */}}
</html>
```

## Changelog

### v0.0.13

- Fix formatting issue #84

### v0.0.12

- Fix several formatting issues
- Improve unformattable script & style detection
- Huge thanks to @jasikpark for validating & cleaning up the issues 🎉

### v0.0.11

- AST rewrite
- Fix inline actions
- If / Else / Else-If support
- Ignore formatting for blocks with `{{/* prettier-ignore */}}
- Ignore large code sections with `{{/* prettier-ignore-start */}}...{{/* prettier-ignore-end */}}
- Tweak general formatting
- Support for multiline actions

### v0.0.10

- Resolve bug #19: Fix template comments.

### v0.0.9

- Resolve bug of single line if statements.

### v0.0.8

- Go block statements will now be indented accordingly. Except for `else`.
  - if, range, block, with, define, end

### v0.0.7

- Fix broken shortcodes. Thanks to @alqu for discovering & fixing the bug.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/alqu"><img src="https://avatars1.githubusercontent.com/u/12250845?v=4?s=100" width="100px;" alt=""/><br /><sub><b>alqu</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3Aalqu" title="Bug reports">🐛</a> <a href="https://github.com/NiklasPor/prettier-plugin-go-template/commits?author=alqu" title="Tests">⚠️</a> <a href="https://github.com/NiklasPor/prettier-plugin-go-template/commits?author=alqu" title="Code">💻</a></td>
    <td align="center"><a href="https://www.gabrielmaldi.com"><img src="https://avatars3.githubusercontent.com/u/3728897?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gabriel Monteagudo</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3Agabrielmaldi" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/bgold0"><img src="https://avatars1.githubusercontent.com/u/4645400?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Bryan</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3Abgold0" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://richtera.org"><img src="https://avatars2.githubusercontent.com/u/708186?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Andreas Richter</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3Arichtera" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://noahbrenner.github.io/"><img src="https://avatars3.githubusercontent.com/u/24858379?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Noah Brenner</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/commits?author=noahbrenner" title="Code">💻</a> <a href="https://github.com/NiklasPor/prettier-plugin-go-template/commits?author=noahbrenner" title="Documentation">📖</a></td>
    <td align="center"><a href="https://silverwind.io"><img src="https://avatars1.githubusercontent.com/u/115237?v=4?s=100" width="100px;" alt=""/><br /><sub><b>silverwind</b></sub></a><br /><a href="#ideas-silverwind" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://codeberg.org/cpence"><img src="https://avatars0.githubusercontent.com/u/297075?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Charles Pence</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3Acpence" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://jasik.xyz"><img src="https://avatars.githubusercontent.com/u/10626596?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Caleb Jasik</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3Ajasikpark" title="Bug reports">🐛</a> <a href="https://github.com/NiklasPor/prettier-plugin-go-template/commits?author=jasikpark" title="Documentation">📖</a> <a href="#example-jasikpark" title="Examples">💡</a> <a href="#ideas-jasikpark" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-jasikpark" title="Maintenance">🚧</a> <a href="#question-jasikpark" title="Answering Questions">💬</a></td>
    <td align="center"><a href="http://DanGold.me"><img src="https://avatars.githubusercontent.com/u/8890238?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dan Gold</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3ALandGod" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://mtlynch.io"><img src="https://avatars.githubusercontent.com/u/7783288?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Michael Lynch</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3Amtlynch" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
