# prettier-plugin-go-template
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

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

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/alqu"><img src="https://avatars1.githubusercontent.com/u/12250845?v=4" width="100px;" alt=""/><br /><sub><b>alqu</b></sub></a><br /><a href="https://github.com/NiklasPor/prettier-plugin-go-template/issues?q=author%3Aalqu" title="Bug reports">🐛</a> <a href="https://github.com/NiklasPor/prettier-plugin-go-template/commits?author=alqu" title="Tests">⚠️</a> <a href="https://github.com/NiklasPor/prettier-plugin-go-template/commits?author=alqu" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!