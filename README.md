# prettier-plugin-go-template

![NPM Badge](https://img.shields.io/npm/v/prettier-plugin-go-template) ![CodeCov Badge](https://img.shields.io/codecov/c/github/niklaspor/prettier-plugin-go-template)

Fixes formatting for go template files. The only peer dependency is [prettier](https://www.npmjs.com/package/prettier).

```
npm install --save-dev prettier-plugin-go-template
```

The following file types are detected automatically:
`.gohtml`, `.gotmpl`, `.go.tmpl`, `.tmpl`, `.tpl`, `.html.tmpl`

## GoHugo / `.html`

To use it with GoHugo and basic `.html` files, you'll have to override the used parser inside your `.prettierrc` file:

```
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

Make sure to always have installed **both** dependencies:

- prettier
- prettier-plugin-go-template

Also make sure that they are installed inside the same scope.
Install both globally (`npm i -g`) or locally – otherwise prettier may not pick up the plugin.

## Changelog

### v0.0.7

- Fix broken shortcodes. Thanks to @alqu for discovering & fixing the bug.
