import { Parser } from "prettier";
import { getMaxListeners } from "process";
import { parentPort } from "worker_threads";
import { createIdGenerator } from "./create-id-generator";

export const parseGoTemplate: Parser<GoNode>["parse"] = (
  text,
  parsers,
  options
) => {
  const regex =
    /{{(?<delimiter><|%)?\s*(?<statement>(?<keyword>if|range|block|with|define|end|else)?.*?)\s*[>%]?}}/g;
  const blocks: {
    start: RegExpMatchArray;
    end: RegExpMatchArray;
  }[] = [];

  const root: GoRoot = {
    type: "root",
    content: text,
    aliasedContent: "",
    children: {},
    index: 0,
    contentStart: 0,
    length: text.length,
  };
  const nodeStack: (GoBlock | GoRoot)[] = [root];
  const getId = createIdGenerator();

  for (let match of text.matchAll(regex)) {
    const current = last(nodeStack);
    const keyword = match.groups?.keyword;
    const statement = match.groups?.statement;

    if (current === undefined) {
      throw Error("Node stack empty.");
    }

    if (match.index === undefined) {
      throw Error("Regex match index undefined.");
    }

    if (statement === undefined) {
      throw Error("Match without statement.");
    }

    if (keyword === "end") {
      if (current.type !== "block") {
        throw Error("Encountered unexpted end keyword.");
      }

      current.length = match[0].length + match.index - current.index;
      current.content = text.substring(current.contentStart, match.index);
      current.aliasedContent = aliasNodeContent(current);

      if (current.parent.type === "double-block") {
        if (idDoubleBlock(current.parent.secondChild)) {
          throw Error("Cannot end parent double block.");
        }

        current.parent.length =
          current.parent.secondChild.index +
          current.parent.secondChild.length -
          current.parent.firstChild.index;
      }

      nodeStack.pop();
    } else if (isBlock(current) && keyword === "else") {
      const secondChild: GoBlock = {
        type: "block",
        statement: statement,
        children: {},
        keyword: keyword,
        index: match.index,
        parent: current,
        contentStart: match.index + match[0].length,
        content: "",
        aliasedContent: "",
        length: -1,
        id: getId(),
      };
      const doubleBlock: GoDoubleBlock = {
        type: "double-block",
        parent: current.parent,
        statement,
        index: current.index,
        length: -1,
        keyword: "else",
        id: current.id,
        firstChild: current,
        secondChild,
      };
      secondChild.parent = doubleBlock;

      current.parent = doubleBlock;
      current.id = getId();

      current.length = match[0].length + match.index - current.index;
      current.content = text.substring(current.contentStart, match.index);
      current.aliasedContent = aliasNodeContent(current);

      if ("children" in doubleBlock.parent) {
        doubleBlock.parent.children[doubleBlock.id] = doubleBlock;
      } else if (doubleBlock.parent.firstChild.id === doubleBlock.id) {
        doubleBlock.parent.firstChild = doubleBlock;
      } else if (doubleBlock.parent.secondChild.id === doubleBlock.id) {
        doubleBlock.parent.secondChild = doubleBlock;
      } else {
        throw Error("Could not find child in parent.");
      }

      nodeStack.pop();
      nodeStack.push(secondChild);
    } else if (keyword) {
      const block: GoBlock = {
        type: "block",
        statement: statement,
        children: {},
        keyword: keyword as GoBlockKeyword,
        index: match.index,
        parent: current,
        contentStart: match.index + match[0].length,
        content: "",
        aliasedContent: "",
        length: -1,
        id: getId(),
      };

      current.children[block.id] = block;
      nodeStack.push(block);
    } else {
      const inline: GoInline = {
        index: match.index,
        length: match[0].length,
        delimiter: getDelimiter(match.groups?.delimiter),
        parent: current!,
        type: "inline",
        statement,
        id: getId(),
      };

      current.children[inline.id] = inline;
    }
  }

  if (!isRoot(nodeStack.pop()!)) {
    throw Error("Missing end block.");
  }

  root.aliasedContent = aliasNodeContent(root);

  return root;
};

function aliasNodeContent(current: GoBlock | GoRoot): string {
  let result = current.content;

  Object.entries(current.children)
    .sort(([_, node1], [__, node2]) => node2.index - node1.index)
    .forEach(
      ([id, node]) =>
        (result =
          result.substring(0, node.index - current.contentStart) +
          id +
          result.substring(node.index + node.length - current.contentStart))
    );

  return result;
}

function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

function getDelimiter(character: string | undefined): GoInlineDelimiter {
  switch (character) {
    case "<":
      return "angle-bracket";
    case "%":
      return "percent";
    default:
      return "none";
  }
}

export type GoNode = GoRoot | GoBlock | GoInline | GoDoubleBlock;

export type GoBlockKeyword =
  | "if"
  | "range"
  | "block"
  | "with"
  | "define"
  | "else";
export type GoInlineDelimiter = "percent" | "angle-bracket" | "none";

export type GoRoot = { type: "root" } & Omit<
  GoBlock,
  "type" | "keyword" | "parent" | "statement" | "id"
>;

export interface GoBaseNode {
  id: string;
  index: number;
  length: number;
  parent: GoBlock | GoRoot | GoDoubleBlock;
  statement: string;
}

export interface GoBlock extends GoBaseNode {
  type: "block";
  keyword: GoBlockKeyword;
  children: {
    [id: string]: GoNode;
  };
  content: string;
  aliasedContent: string;
  contentStart: number;
}

export interface GoDoubleBlock extends GoBaseNode {
  type: "double-block";
  firstChild: GoBlock | GoDoubleBlock;
  secondChild: GoBlock | GoDoubleBlock;
  keyword: GoBlockKeyword;
}

export interface GoInline extends GoBaseNode {
  type: "inline";
  delimiter: GoInlineDelimiter;
}

export function isInline(node: GoNode): node is GoInline {
  return node.type === "inline";
}

export function isBlock(node: GoNode): node is GoBlock {
  return node.type === "block";
}

export function idDoubleBlock(node: GoNode): node is GoDoubleBlock {
  return node.type === "double-block";
}

export function isRoot(node: GoNode): node is GoRoot {
  return node.type === "root";
}
