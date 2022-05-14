import {
  doc,
  FastPath,
  Parser,
  ParserOptions,
  Printer,
  SupportLanguage,
} from "prettier";
import { builders, utils } from "prettier/doc";
import { parsers as htmlParsers } from "prettier/parser-html";
import {
  GoBlock,
  GoInline,
  GoInlineEndDelimiter,
  GoInlineStartDelimiter,
  GoMultiBlock,
  GoNode,
  GoRoot,
  GoUnformattable,
  isBlock,
  isMultiBlock,
  isRoot,
  parseGoTemplate,
} from "./parse";

const htmlParser = htmlParsers.html;
const PLUGIN_KEY = "go-template";

type ExtendedParserOptions = ParserOptions<GoNode> &
  PrettierPluginGoTemplateParserOptions;

export type PrettierPluginGoTemplateParserOptions = {
  goTemplateBracketSpacing: boolean;
};

export const options: {
  [K in keyof PrettierPluginGoTemplateParserOptions]: any;
} = {
  goTemplateBracketSpacing: {
    type: "boolean",
    category: "Global",
    description:
      "Specifies whether the brackets should have spacing around the statement.",
    default: true,
  },
};

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
    astFormat: PLUGIN_KEY,
    preprocess: (text) =>
      // Cut away trailing newline to normalize formatting.
      text.endsWith("\n") ? text.slice(0, text.length - 1) : text,
    parse: parseGoTemplate,
    locStart: (node) => node.index,
    locEnd: (node) => node.index + node.length,
  },
};
export const printers = {
  [PLUGIN_KEY]: <Printer<GoNode>>{
    print: (path, options: ExtendedParserOptions, print) => {
      const node = path.getNode();

      switch (node?.type) {
        case "inline":
          return printInline(node, path, options, print);
        case "double-block":
          return printMultiBlock(node, path, print);
        case "unformattable":
          return printUnformattable(node, options);
      }

      throw new Error(
        `An error occured during printing. Found invalid node ${node?.type}.`
      );
    },
    embed: (path, print, textToDoc, options) => {
      try {
        return embed(path, print, textToDoc, options);
      } catch (e) {
        console.error("Formatting failed.", e);
        throw e;
      }
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

  const mapped = utils.stripTrailingHardline(
    utils.mapDoc(html, (currentDoc) => {
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
    })
  );

  if (isRoot(node)) {
    return builders.concat([mapped, builders.hardline]);
  }

  const startStatement = path.call(print, "start");
  const endStatement = node.end ? path.call(print, "end") : "";

  if (isPrettierIgnoreBlock(node)) {
    return builders.concat([
      utils.removeLines(path.call(print, "start")),
      printPlainBlock(node.content),
      endStatement,
    ]);
  }

  const content = node.aliasedContent.trim()
    ? builders.indent(builders.concat([builders.softline, mapped]))
    : "";

  const result = builders.concat([
    startStatement,
    content,
    builders.softline,
    endStatement,
  ]);

  const emptyLine =
    !!node.end && isFollowedByEmptyLine(node.end, options.originalText)
      ? builders.softline
      : "";

  if (isMultiBlock(node.parent)) {
    return builders.concat([result, emptyLine]);
  }

  return builders.group(builders.concat([builders.group(result), emptyLine]), {
    shouldBreak: !!node.end && hasNodeLinebreak(node.end, options.originalText),
  });
};

type PrintFn = (path: FastPath<GoNode>) => builders.Doc;

function printMultiBlock(
  node: GoMultiBlock,
  path: FastPath<GoNode>,
  print: PrintFn
): builders.Doc {
  return builders.concat([...path.map(print, "blocks")]);
}

function isFollowedByNode(node: GoInline): boolean {
  const parent = getFirstBlockParent(node).parent;
  const start = parent.aliasedContent.indexOf(node.id) + node.id.length;

  let nextNodeIndex = -1;
  Object.keys(parent.children).forEach((key) => {
    const index = parent.aliasedContent.indexOf(key, start);
    if (nextNodeIndex == -1 || index < nextNodeIndex) {
      nextNodeIndex = index;
    }
  });

  return !!parent.aliasedContent
    .substring(start, nextNodeIndex)
    .match(/^\s+$/m);
}

function printInline(
  node: GoInline,
  path: FastPath<GoNode>,
  options: ExtendedParserOptions,
  print: PrintFn
): builders.Doc {
  const isBlockNode = isBlockEnd(node) || isBlockStart(node);
  const emptyLine =
    isFollowedByEmptyLine(node, options.originalText) && isFollowedByNode(node)
      ? builders.softline
      : "";

  const result: builders.Doc[] = [
    printStatement(node.statement, options.goTemplateBracketSpacing, {
      start: node.startDelimiter,
      end: node.endDelimiter,
    }),
  ];

  return builders.group(builders.concat([...result, emptyLine]), {
    shouldBreak: hasNodeLinebreak(node, options.originalText) && !isBlockNode,
  });
}

function isBlockEnd(node: GoInline) {
  const { parent } = getFirstBlockParent(node);
  return isBlock(parent) && parent.end === node;
}

function isBlockStart(node: GoInline) {
  const { parent } = getFirstBlockParent(node);
  return isBlock(parent) && parent.start === node;
}

function printStatement(
  statement: string,
  addSpaces: boolean,
  delimiter: { start: GoInlineStartDelimiter; end: GoInlineEndDelimiter } = {
    start: "",
    end: "",
  }
) {
  const space = addSpaces ? " " : "";
  const shouldBreak = statement.includes("\n");

  const content = shouldBreak
    ? statement
        .trim()
        .split("\n")
        .map((line, _, array) =>
          array.indexOf(line) === array.length - 1
            ? builders.concat([line.trim(), builders.softline])
            : builders.indent(builders.concat([line.trim(), builders.softline]))
        )
    : [statement.trim()];

  return builders.group(
    builders.concat([
      "{{",
      delimiter.start,
      space,
      ...content,
      shouldBreak ? "" : space,
      delimiter.end,
      "}}",
    ]),
    { shouldBreak }
  );
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
  return isBlock(node) && node.keyword === "prettier-ignore-start";
}

function hasNodeLinebreak(node: GoInline, source: string) {
  const start = node.index + node.length;
  const end = source.indexOf("\n", start);
  const suffix = source.substring(start, end);

  return !suffix;
}

function isFollowedByEmptyLine(node: GoInline, source: string) {
  const start = node.index + node.length;
  const firstLineBreak = source.indexOf("\n", start);
  const secondLineBreak = source.indexOf("\n", firstLineBreak + 1);
  const emptyLine = source
    .substring(firstLineBreak + 1, secondLineBreak)
    .trim();
  const isLastNode = !!source.substring(start).match(/^\s*$/);

  return (
    firstLineBreak !== -1 && secondLineBreak !== -1 && !emptyLine && !isLastNode
  );
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

function printUnformattable(
  node: GoUnformattable,
  options: ExtendedParserOptions
) {
  const start = options.originalText.lastIndexOf("\n", node.index - 1);
  const line = options.originalText.substring(start, node.index + node.length);
  const lineWithoutAdditionalContent =
    line.replace(node.content, "").match(/\s*$/)?.[0] ?? "";

  return printPlainBlock(lineWithoutAdditionalContent + node.content, false);
}

function printPlainBlock(text: string, hardlines = true): builders.Doc {
  const isTextEmpty = (input: string) => !!input.match(/^\s*$/);

  const lines = text.split("\n");

  const segments = lines.filter(
    (value, i) => !(i == 0 || i == lines.length - 1) || !isTextEmpty(value)
  );

  return builders.concat([
    ...segments.map((content, i) =>
      builders.concat([
        hardlines || i ? builders.hardline : "",
        builders.trim,
        content,
      ])
    ),
    hardlines ? builders.hardline : "",
  ]);
}
