import {
  GoDoubleBlock,
  GoInline,
  GoInlineDelimiter,
  GoRoot,
  idDoubleBlock,
} from "./parse";
import { GoBlock } from "./parse";
import { doc, Doc, FastPath, Parser, Plugin, Printer } from "prettier";
import { parsers as htmlParsers } from "prettier/parser-html";
import { GoNode, parseGoTemplate } from "./parse";
import { builders } from "prettier/doc";

const htmlParser = htmlParsers.html;
const PLUGIN_KEY = "go-template";

export const GoTemplatePlugin: Plugin = {
  parsers: {
    [PLUGIN_KEY]: <Parser<GoNode>>{
      ...htmlParser,
      astFormat: PLUGIN_KEY,
      preprocess: (text) => text,
      parse: parseGoTemplate,
    },
  },
  printers: {
    [PLUGIN_KEY]: <Printer<GoNode>>{
      print: (path, options, print) => {
        const node = path.getNode();

        switch (node?.type) {
          case "inline":
            return printInline(node, path, print);
          case "double-block":
            return printDoubleBlock(node, path, print);
        }

        return "welp";
      },
      embed: (path, print, textToDoc, options) => {
        const node = path.getNode();

        if (!(node?.type === "block" || node?.type === "root")) {
          return;
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

        const endStatement =
          idDoubleBlock(node.parent) && node.parent.firstChild === node
            ? ""
            : printStatement("end");

        const result = builders.concat([
          printStatement(node.statement),
          builders.group(
            builders.indent(builders.concat([builders.hardline, mapped]))
          ),
          builders.hardline,
          endStatement,
        ]);

        return result;
      },
    },
  },
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
  return printStatement(node.statement, node.delimiter);
}

function printStatement(statement: string, delimiter?: GoInlineDelimiter) {
  const delimiters = getDelimiters(delimiter ?? "none");
  return builders.group(
    builders.concat([
      "{{",
      delimiters.start,
      " ",
      statement.trim(),
      " ",
      delimiters.end,
      "}}",
    ])
  );
}

function getDelimiters(delimiter: GoInlineDelimiter) {
  return {
    ["angle-bracket"]: {
      start: "<",
      end: ">",
    },
    ["percent"]: {
      start: "%",
      end: "%",
    },
    ["none"]: {
      start: "",
      end: "",
    },
  }[delimiter];
}

export default GoTemplatePlugin;
