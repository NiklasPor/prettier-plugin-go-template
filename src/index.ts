import { doc, Parser, Printer, SupportLanguage } from "prettier";
import { parsers as htmlParsers } from "prettier/parser-html";

function stringHashcode(input: string): number {
  var hash = 0,
    i,
    chr;
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

const htmlParser = htmlParsers.html;
const buildReplacement = (input: string) => `BPGT${stringHashcode(input)}EPGT`;

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

        const replacement = buildReplacement(result);
        replacedText = replacedText.replace(result, replacement);

        const cleanedResult = result
          .replace(/{{(?!-)[ \t]*/g, "{{ ")
          .replace(/[ \t]*(?<!-)}}/g, " }}")
          .replace(/{{-[ \t]*/g, "{{- ")
          .replace(/[ \t]*-}}/g, " -}}")
          .replace(/ *\n/g, "\n");

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

        const regexp = /BPGT.*?EPGT/g;

        let result = docLeaf;
        let match: RegExpExecArray | null;

        // tslint:disable-next-line: no-conditional-assignment
        while ((match = regexp.exec(docLeaf)) != null) {
          const hash = match[0];

          const replacement = replacements.get(hash);

          if (replacement) {
            result = result.replace(hash, replacement);
            replacedHashes.push(hash);
          }
        }

        return result;
      });

      replacedHashes.forEach((hash) => replacements.delete(hash));

      return mappedDoc;
    },
  },
};
