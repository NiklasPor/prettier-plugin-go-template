import { doc, FastPath, Parser, Printer, SupportLanguage } from "prettier";
import { builders } from "prettier/doc";
import { parsers as htmlParsers } from "prettier/parser-html";
import {
  GoBlock,
  GoBlockKeyword,
  GoDoubleBlock,
  GoInline,
  GoInlineEndDelimiter,
  GoInlineStartDelimiter,
  GoNode,
  GoRoot,
  idDoubleBlock,
  isBlock,
  isInline,
  isRoot,
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
    locStart: (node) => node.index,
    locEnd: (node) => node.index + node.length,
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

  if (!node) {
    return null;
  }

  if (hasPrettierIgnoreLine(node)) {
    return options.originalText.substring(
      options.locStart(node),
      options.locEnd(node)
    );
  }

  if (node.type !== "block" && node.type !== "root") {
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

  const startStatement = printStartBlockStatement(node);
  const endStatement =
    idDoubleBlock(node.parent) && node.parent.firstChild === node
      ? ""
      : printEndBlockStatement(node);

  if (isPrettierIgnoreBlock(node)) {
    return builders.concat([
      startStatement,
      printPlainBlock(node.content),
      endStatement,
    ]);
  }

  const result = builders.concat([
    startStatement,
    builders.indent(builders.concat([builders.softline, mapped])),
    builders.softline,
    endStatement,
  ]);

  return idDoubleBlock(node.parent) ? result : builders.group(result);
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
  path?: FastPath<GoNode>,
  print?: PrintFn
): builders.Doc {
  return printStatement(node.statement, {
    start: node.startDelimiter,
    end: node.endDelimiter,
  });
}

function printStartBlockStatement(node: GoBlock) {
  return printInline(node.start);
}

function printEndBlockStatement(node: GoBlock) {
  return printInline(node.end);
}

function printStatement(
  statement: string,
  delimiter: { start: GoInlineStartDelimiter; end: GoInlineEndDelimiter } = {
    start: "",
    end: "",
  }
) {
  return builders.concat([
    "{{",
    delimiter.start,
    " ",
    statement.trim(),
    " ",
    delimiter.end,
    "}}",
  ]);
}

function hasPrettierIgnoreLine(node: GoNode) {
  if (isRoot(node)) {
    return false;
  }

  const { parent, child } = getFirstBlockParent(node);

  const regex = new RegExp(
    `(?:<!--|{{).*?prettier-ignore.*?(?:-->|}})\n.*${child.id}`
  );

  return !!parent.aliasedContent.match(regex);
}

function isPrettierIgnoreBlock(node: GoNode) {
  return node.type === "block" && node.keyword === "prettier-ignore-start";
}

function getFirstBlockParent(node: Exclude<GoNode, GoRoot>): {
  parent: GoBlock | GoRoot;
  child: typeof node;
} {
  let previous = node;
  let current = node.parent;

  while (!isBlock(current) && !isRoot(current)) {
    previous = current;
    current = current.parent;
  }

  return {
    child: previous,
    parent: current,
  };
}

function printPlainBlock(text: string): builders.Doc {
  const isTextEmpty = (input: string) => !!input.match(/^\s*$/);

  const lines = text.split("\n");

  const segments = lines.filter(
    (value, i) => !(i == 0 || i == lines.length - 1) || !isTextEmpty(value)
  );

  return builders.concat([
    ...segments.map((content) =>
      builders.concat([builders.hardline, builders.trim, content])
    ),
    builders.hardline,
  ]);
}
