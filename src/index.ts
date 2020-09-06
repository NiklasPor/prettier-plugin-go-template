import { doc, Parser, Printer, SupportLanguage } from "prettier";
import { parsers as htmlParsers } from "prettier/parser-html";
import * as uuid from "uuid";

const blockHashes = new Array<string>();

const htmlParser = htmlParsers.html;
const buildReplacement = (input: string) => {
  const id = uuid.v4().replace(/-/g, "");

  if (input.match(/{{[-<]? (?:if|range|block|with|define)/)) {
    blockHashes.push(id);
    return `<BPGT${id}EPGT>`;
  }

  if (input.match(/{{[-<]? end/)) {
    return `</BPGT${blockHashes.pop()}EPGT>`;
  }

  return `BPGT${id}EPGT`;
};

const replacements = new Map<string, string>();

export const parsers = {
  "go-template": <Parser>{
    ...htmlParser,
    astFormat: "go-template",
    preprocess: (text) => {
      const regexp = /(?:{{.*?}}(?: *\n)?)|(?:<script(?:\n|.)*?>)((?:\n|.)*?)(?:<\/script>)/g;

      let replacedText = text.trim();
      let match: RegExpExecArray | null;
      // tslint:disable-next-line: no-conditional-assignment
      while ((match = regexp.exec(text)) != null) {
        const result = match[0];

        if (!result.includes("{{")) {
          continue;
        }

        const cleanedResult = result
          // clean except for hyphens and shortcodes
          .replace(/{{(?![-<])[ \t]*/g, "{{ ")
          .replace(/[ \t]*(?<![->])}}/g, " }}")

          // clean hyphens
          .replace(/{{-[ \t]*/g, "{{- ")
          .replace(/[ \t]*-}}/g, " -}}")

          // clean shortcodes, e.g. "{{<    year    >}}" -> "{{< year >}}"
          .replace(/{{<[ \t]*/g, "{{< ")
          .replace(/[ \t]*>}}/g, " >}}")

          .replace(/ *\n/g, "\n");

        const replacement = buildReplacement(cleanedResult);
        replacedText = replacedText.replace(result, replacement);

        replacements.set(replacement, cleanedResult);
      }

      return replacedText;
    },
  },
};

export const languages: SupportLanguage[] = [
  {
    name: "GoTemplate",
    parsers: ["go-template"],
    extensions: [
      ".go.html",
      ".gohtml",
      ".gotmpl",
      ".go.tmpl",
      ".tmpl",
      ".tpl",
      ".html.tmpl",
      ".html.tpl",
    ],
    vscodeLanguageIds: ["gotemplate", "gohtml", "GoTemplate", "GoHTML"],
  },
];

function replaceSingles(input: string, replacedHashes = new Array<string>()) {
  const regexp = /BPGT.*?EPGT/g;

  let result = input;
  let match: RegExpExecArray | null;

  // tslint:disable-next-line: no-conditional-assignment
  while ((match = regexp.exec(input)) != null) {
    const hash = match[0];

    const replacement = replacements.get(hash);

    if (replacement) {
      result = result.replace(hash, replacement);
      replacedHashes.push(hash);
    }
  }

  return result;
}

let lastWasOpenClosingTag = false;

function replaceBlocks(input: string, replacedHashes = new Array<string>()) {
  const openingTag = (input.match(/<BPGT.*EPGT>/) ?? [])[0];
  const fullClosingTag = (input.match(/<\/BPGT.*EPGT>/) ?? [])[0];
  const openClosingTag = (input.match(/<\/BPGT.*EPGT/) ?? [])[0];

  if (openingTag) {
    replacedHashes.push(openingTag);
    return input.replace(openingTag, replacements.get(openingTag)!);
  }

  if (fullClosingTag) {
    replacedHashes.push(fullClosingTag);
    return input.replace(fullClosingTag, replacements.get(fullClosingTag)!);
  }

  if (openClosingTag) {
    const fixedClosingTag = openClosingTag + ">";
    lastWasOpenClosingTag = true;

    replacedHashes.push(fixedClosingTag);
    return input.replace(openClosingTag, replacements.get(fixedClosingTag)!);
  }

  if (lastWasOpenClosingTag && input.trim() === ">") {
    lastWasOpenClosingTag = false;
    return "";
  }

  return input;
}

export const printers = {
  "go-template": <Printer>{
    embed: (_, __, textToDoc, options) => {
      const htmlDoc = textToDoc(options.originalText, {
        parser: "html",
      });

      const replacedHashes: string[] = [];

      const mappedDoc = doc.utils.mapDoc(htmlDoc, (docLeaf) => {
        if (typeof docLeaf !== "string") {
          return docLeaf;
        }

        let result = docLeaf;

        result = replaceSingles(result, replacedHashes);

        result = replaceBlocks(result, replacedHashes);

        return result;
      });

      replacedHashes.forEach((hash) => replacements.delete(hash));

      return mappedDoc;
    },
  },
};
