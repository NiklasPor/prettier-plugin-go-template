# prettier-plugin-go-template

![NPM Badge](https://img.shields.io/npm/v/prettier-plugin-go-template) ![CodeCov Badge](https://img.shields.io/codecov/c/github/niklaspor/prettier-plugin-go-template)

Fixes formatting for go template files. The only peer dependency is [prettier](https://www.npmjs.com/package/prettier).

```
npm install --save-dev prettier-plugin-go-template
```

The following file types are detected automatically:
`.gohtml`, `.gotmpl`, `.go.tmpl`, `.tmpl`, `.tpl`, `.html.tmpl`

> **Notice:** GoHugo currently does **not** support other extensions than `.html` inside the lookup order. You can still include `.gohtml` files by using them as a partial.
