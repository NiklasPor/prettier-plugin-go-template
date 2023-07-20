# Changelog

## 0.0.15

- Readme update for easier setup on npm.

## 0.0.14

- **Breaking Change**: Prettier support now starts at `3.0.0`. For older Prettier versions use `prettier-plugin-go-template@0.0.13` and below.

## 0.0.13

- Fix formatting issue #84

## 0.0.12

- Fix several formatting issues
- Improve unformattable script & style detection
- Huge thanks to @jasikpark for validating & cleaning up the issues 🎉

## 0.0.11

- AST rewrite
- Fix inline actions
- If / Else / Else-If support
- Ignore formatting for blocks with `{{/* prettier-ignore */}}
- Ignore large code sections with `{{/* prettier-ignore-start */}}...{{/* prettier-ignore-end */}}
- Tweak general formatting
- Support for multiline actions

## 0.0.10

- Resolve bug #19: Fix template comments.

## 0.0.9

- Resolve bug of single line if statements.

## 0.0.8

- Go block statements will now be indented accordingly. Except for `else`.
  - if, range, block, with, define, end

## 0.0.7

- Fix broken shortcodes. Thanks to @alqu for discovering & fixing the bug.
