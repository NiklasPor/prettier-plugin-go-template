# prettier-plugin-go-template

![NPM Badge](https://img.shields.io/npm/v/prettier-plugin-go-template) ![CodeCov Badge](https://img.shields.io/codecov/c/github/niklaspor/prettier-plugin-go-template)

Fixes formatting for go template files. The only peer dependency is [prettier](https://www.npmjs.com/package/prettier).

```
npm install --save-dev prettier-plugin-go-template
```

The following file types are detected automatically:
`.gohtml`, `.gotmpl`, `.go.tmpl`, `.tmpl`, `.tpl`, `.html.tmpl`

## GoHugo

GoHugo currently does **not** support other extensions than `.html` inside the lookup order: [GoHugo Issue.](https://github.com/gohugoio/hugo/issues/3230)

It is still possible to include `.gohtml` files by using them as a partial inside `.html` files, but not as default files in the lookup order.
