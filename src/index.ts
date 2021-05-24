import { doc, FastPath, Parser, Printer, SupportLanguage } from "prettier";
import { builders } from "prettier/doc";
import { parsers as htmlParsers } from "prettier/parser-html";
import {
  GoDoubleBlock,
  GoInline,
  GoInlineEndDelimiter,
  GoInlineStartDelimiter,
  GoNode,
  idDoubleBlock,
  parseGoTemplate,
} from "./parse";

const htmlParser = htmlParsers.html;
const PLUGIN_KEY = "go-template";

export const languages: SupportLanguage[] = [
  {
    name: "GoTemplate",
    parsers: [PLUGIN_KEY],
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
export const parsers = {
  [PLUGIN_KEY]: <Parser<GoNode>>{
    ...htmlParser,
    astFormat: PLUGIN_KEY,
    preprocess: (text) => text,
    parse: parseGoTemplate,
  },
};
export const printers = {
  [PLUGIN_KEY]: <Printer<GoNode>>{
    print: (path, options, print) => {
      const node = path.getNode();

      switch (node?.type) {
        case "inline":
          return printInline(node, path, print);
        case "double-block":
          return printDoubleBlock(node, path, print);
      }

      console.error(
        `An error occured during printing. Found invalid node ${node?.type}`
      );

      return options.originalText;
    },
    embed: (path, print, textToDoc, options) => {
      try {
        return embed(path, print, textToDoc, options);
      } catch (e) {
        console.error("Formatting failed.", e);
      }

      return options.originalText;
    },
  },
};

const embed: Exclude<Printer<GoNode>["embed"], undefined> = (
  path,
  print,
  textToDoc,
  options
) => {
  const node = path.getNode();

  if (!(node?.type === "block" || node?.type === "root")) {
    return null;
  }

  const html = textToDoc(node.aliasedContent, {
    ...options,
    parser: "html",
    parentParser: "go-template",
  });

  const mapped = doc.utils.mapDoc(html, (currentDoc) => {
    if (typeof currentDoc !== "string") {
      return currentDoc;
    }

    let result: builders.Doc = currentDoc;

    Object.keys(node.children).forEach(
      (key) =>
        (result = doc.utils.mapDoc(result, (docNode) =>
          typeof docNode !== "string" || !docNode.includes(key)
            ? docNode
            : builders.concat([
                docNode.substring(0, docNode.indexOf(key)),
                path.call(print, "children", key),
                docNode.substring(docNode.indexOf(key) + key.length),
              ])
        ))
    );

    return result;
  });

  if (node.type === "root") {
    return mapped;
  }

  if (Array.isArray(mapped)) {
    mapped.pop();
  }

  const startStatement = printStatement(node.statement);
  const endStatement =
    idDoubleBlock(node.parent) && node.parent.firstChild === node
      ? ""
      : printStatement("end");

  if (!node.content.trim()) {
    return builders.concat([startStatement, builders.hardline, endStatement]);
  }

  const result = builders.concat([
    startStatement,
    builders.group(
      builders.indent(builders.concat([builders.hardline, mapped]))
    ),
    builders.hardline,
    endStatement,
  ]);

  return result;
};

type PrintFn = (path: FastPath<GoNode>) => builders.Doc;

function printDoubleBlock(
  node: GoDoubleBlock,
  path: FastPath<GoNode>,
  print: PrintFn
): builders.Doc {
  return builders.concat([
    path.call(print, "firstChild"),
    path.call(print, "secondChild"),
  ]);
}

function printInline(
  node: GoInline,
  path: FastPath<GoNode>,
  print: PrintFn
): builders.Doc {
  return printStatement(node.statement, {
    start: node.startDelimiter,
    end: node.endDelimiter,
  });
}

function printStatement(
  statement: string,
  delimiter: { start: GoInlineStartDelimiter; end: GoInlineEndDelimiter } = {
    start: "",
    end: "",
  }
) {
  return builders.group(
    builders.concat([
      "{{",
      delimiter.start,
      " ",
      statement.trim(),
      " ",
      delimiter.end,
      "}}",
    ])
  );
}
