import { doc, Parser, Printer, SupportLanguage } from "prettier";
import { parsers as htmlParsers } from "prettier/parser-html";

const htmlParser = htmlParsers.html;
const uniqueID = "pgt-a30fz9";
const uniquePrefix = "pgt-b30fz9";
const uniqueSuffix = "pgt-c30fz9";

const openingBrackets = "{{";
const closingBrackets = "}}";
const openingBracketsReplacement = `<!--${uniqueID}`;
const closingBracketsReplacement = `${uniqueID}-->`;

const uniqueSuffixRegex = new RegExp(uniqueSuffix, "g");
const uniquePrefixRegex = new RegExp(uniquePrefix, "g");
const openingBracketsRegex = new RegExp(openingBrackets, "g");
const closingBracketsRegex = new RegExp(closingBrackets, "g");
const closingBracketsNewlineRegex = new RegExp(closingBrackets + " *\n", "g");

const openingBracketsReplacementRegex = new RegExp(
  openingBracketsReplacement,
  "g"
);
const closingBracketsReplacementRegex = new RegExp(
  closingBracketsReplacement,
  "g"
);

export const parsers = {
  "go-template": <Parser>{
    ...htmlParser,
    astFormat: "go-template",
    preprocess: (text) => {
      let result = text;

      result = result.replace(
        openingBracketsRegex,
        uniquePrefix + openingBracketsReplacement
      );

      result = result.replace(
        closingBracketsNewlineRegex,
        closingBracketsReplacement + "\n"
      );

      result = result.replace(
        closingBracketsRegex,
        closingBracketsReplacement + uniqueSuffix
      );

      return result;
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

      const mappedDoc = doc.utils.mapDoc(htmlDoc, (docLeaf) => {
        if (typeof docLeaf !== "string") {
          return docLeaf;
        }

        let result = docLeaf;

        result = result.replace(
          openingBracketsReplacementRegex,
          openingBrackets
        );

        result = result.replace(
          closingBracketsReplacementRegex,
          closingBrackets
        );

        result = result.replace(uniqueSuffixRegex, "");
        result = result.replace(uniquePrefixRegex, "");

        return result;
      });

      return mappedDoc;
    },
  },
};
