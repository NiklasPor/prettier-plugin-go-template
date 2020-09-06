import { doc, Parser, Printer, SupportLanguage } from "prettier";
import { parsers as htmlParsers } from "prettier/parser-html";

const blockHashes = new Array<string>();
const htmlParser = htmlParsers.html;

let _id = 0;
const getId = () => {
  _id = _id + (1 % Number.MAX_SAFE_INTEGER);
  return _id.toString();
};

const buildReplacement = (input: string) => {
  const id = getId();

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
      //
      const regexp = /(?:{{.*?}})|(?:<script(?:\n|.)*?>)((?:\n|.)*?)(?:<\/script>)/gm;

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

          .replace(/ *\n/g, "\n")
          .trim();

        const replacement = buildReplacement(cleanedResult);

        replacedText = replacedText.replace(result, replacement);

        const forceLinebreak = !!replacedText.match(
          new RegExp(`^[ \t]*${replacement}[ \t]*$`, "gm")
        );

        if (forceLinebreak && !replacement.includes("<")) {
          const linebreakReplacement = `<!--BPGT${replacement}EPGT-->`;

          replacedText = replacedText.replace(
            replacement,
            linebreakReplacement
          );
          replacements.set(linebreakReplacement, cleanedResult);
        } else {
          replacements.set(replacement, cleanedResult);
        }
      }

      if (blockHashes.length > 0) {
        throw Error("Missing ending block.");
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
  const regexp = /(?:<!--BPGT)?BPGT.*?EPGT(?:EPGT-->)?/g;

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

let lastMissedBracket = false;

function replaceBlocks(input: string, replacedHashes = new Array<string>()) {
  let result = input;

  const fullOpeningTags = input.match(/<BPGT.*?EPGT>/g) ?? [];
  const openOpeningTag = (input.match(/<BPGT.*?EPGT(?!>)/g) ?? [])[0];
  const fullClosingTags = input.match(/<\/BPGT.*?EPGT>/g) ?? [];
  const openClosingTag = (input.match(/<\/BPGT.*?EPGT(?!>)/g) ?? [])[0];

  if (lastMissedBracket && input.match(/[\t ]*>/)) {
    lastMissedBracket = false;
    result = result.replace(/[\t ]*>/, "");
  }

  fullOpeningTags.forEach((openingTag) => {
    replacedHashes.push(openingTag);
    result = result.replace(openingTag, replacements.get(openingTag)!);
  });

  if (openOpeningTag) {
    const fixedOpeningTag = openOpeningTag + ">";
    lastMissedBracket = true;

    replacedHashes.push(fixedOpeningTag);
    result = result.replace(openOpeningTag, replacements.get(fixedOpeningTag)!);
  }

  fullClosingTags.forEach((fullClosingTag) => {
    replacedHashes.push(fullClosingTag);
    result = result.replace(fullClosingTag, replacements.get(fullClosingTag)!);
  });

  if (openClosingTag) {
    const fixedClosingTag = openClosingTag + ">";
    lastMissedBracket = true;

    replacedHashes.push(fixedClosingTag);
    result = result.replace(openClosingTag, replacements.get(fixedClosingTag)!);
  }

  return result;
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
