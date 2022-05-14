import { Parser } from "prettier";
import { createIdGenerator } from "./create-id-generator";

export const parseGoTemplate: Parser<GoNode>["parse"] = (
  text,
  parsers,
  options
) => {
  const regex =
    /{{(?<startdelimiter>-|<|%|\/\*)?\s*(?<statement>(?<keyword>if|range|block|with|define|end|else|prettier-ignore-start|prettier-ignore-end)?[\s\S]*?)\s*(?<endDelimiter>-|>|%|\*\/)?}}|(?<unformattableScript><(script)((?!<)[\s\S])*>((?!<\/script)[\s\S])*?{{[\s\S]*?<\/(script)>)|(?<unformattableStyle><(style)((?!<)[\s\S])*>((?!<\/style)[\s\S])*?{{[\s\S]*?<\/(style)>)/g;
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
    const keyword = match.groups?.keyword as GoBlockKeyword | undefined;
    const statement = match.groups?.statement;
    const unformattable =
      match.groups?.unformattableScript ?? match.groups?.unformattableStyle;

    const startDelimiter = (match.groups?.startdelimiter ??
      "") as GoInlineStartDelimiter;
    const endDelimiter = (match.groups?.endDelimiter ??
      "") as GoInlineEndDelimiter;

    if (current === undefined) {
      throw Error("Node stack empty.");
    }

    if (match.index === undefined) {
      throw Error("Regex match index undefined.");
    }
    const id = getId();
    if (unformattable) {
      current.children[id] = {
        id,
        type: "unformattable",
        index: match.index,
        length: match[0].length,
        content: unformattable,
        parent: current,
      };
      continue;
    }

    if (statement === undefined) {
      throw Error("Formattable match without statement.");
    }

    const inline: GoInline = {
      index: match.index,
      length: match[0].length,
      startDelimiter,
      endDelimiter,
      parent: current!,
      type: "inline",
      statement,
      id,
    };

    if (keyword === "end" || keyword === "prettier-ignore-end") {
      if (current.type !== "block") {
        throw Error("Encountered unexpected end keyword.");
      }

      current.length = match[0].length + match.index - current.index;
      current.content = text.substring(current.contentStart, match.index);
      current.aliasedContent = aliasNodeContent(current);
      current.end = inline;

      if (current.parent.type === "double-block") {
        const firstChild = current.parent.blocks[0];
        const lastChild =
          current.parent.blocks[current.parent.blocks.length - 1];

        current.parent.length =
          lastChild.index + lastChild.length - firstChild.index;
      }

      nodeStack.pop();
    } else if (isBlock(current) && keyword === "else") {
      const nextChild: GoBlock = {
        type: "block",
        start: inline,
        end: null,
        children: {},
        keyword: keyword,
        index: match.index,
        parent: current.parent,
        contentStart: match.index + match[0].length,
        content: "",
        aliasedContent: "",
        length: -1,
        id: getId(),
        startDelimiter,
        endDelimiter,
      };

      if (isMultiBlock(current.parent)) {
        current.parent.blocks.push(nextChild);
      } else {
        const multiBlock: GoMultiBlock = {
          type: "double-block",
          parent: current.parent,
          index: current.index,
          length: -1,
          keyword,
          id: current.id,
          blocks: [current, nextChild],
        };
        nextChild.parent = multiBlock;
        current.parent = multiBlock;

        if ("children" in multiBlock.parent) {
          multiBlock.parent.children[multiBlock.id] = multiBlock;
        } else {
          throw Error("Could not find child in parent.");
        }
      }

      current.id = getId();
      current.length = match[0].length + match.index - current.index;
      current.content = text.substring(current.contentStart, match.index);
      current.aliasedContent = aliasNodeContent(current);

      nodeStack.pop();
      nodeStack.push(nextChild);
    } else if (keyword) {
      const block: GoBlock = {
        type: "block",
        start: inline,
        end: null,
        children: {},
        keyword: keyword as GoBlockKeyword,
        index: match.index,
        parent: current,
        contentStart: match.index + match[0].length,
        content: "",
        aliasedContent: "",
        length: -1,
        id: getId(),
        startDelimiter,
        endDelimiter,
      };

      current.children[block.id] = block;
      nodeStack.push(block);
    } else {
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

export type GoNode =
  | GoRoot
  | GoBlock
  | GoInline
  | GoMultiBlock
  | GoUnformattable;

export type GoBlockKeyword =
  | "if"
  | "range"
  | "block"
  | "with"
  | "define"
  | "else"
  | "prettier-ignore-start"
  | "prettier-ignore-end"
  | "end";

export type GoRoot = { type: "root" } & Omit<
  GoBlock,
  | "type"
  | "keyword"
  | "parent"
  | "statement"
  | "id"
  | "startDelimiter"
  | "endDelimiter"
  | "start"
  | "end"
>;

export interface GoBaseNode<Type extends string> {
  id: string;
  type: Type;
  index: number;
  length: number;
  parent: GoBlock | GoRoot | GoMultiBlock;
}

export interface GoBlock extends GoBaseNode<"block">, WithDelimiter {
  keyword: GoBlockKeyword;
  children: {
    [id: string]: GoNode;
  };
  start: GoInline;
  end: GoInline | null;
  content: string;
  aliasedContent: string;
  contentStart: number;
}

export interface GoMultiBlock extends GoBaseNode<"double-block"> {
  blocks: (GoBlock | GoMultiBlock)[];
  keyword: GoBlockKeyword;
}

export type GoSharedDelimiter = "%" | "-" | "";
export type GoInlineStartDelimiter = "<" | "/*" | GoSharedDelimiter;
export type GoInlineEndDelimiter = ">" | "*/" | GoSharedDelimiter;

export interface GoUnformattable extends GoBaseNode<"unformattable"> {
  content: string;
}

export interface WithDelimiter {
  startDelimiter: GoInlineStartDelimiter;
  endDelimiter: GoInlineEndDelimiter;
}

export interface GoInline extends GoBaseNode<"inline">, WithDelimiter {
  statement: string;
}

export function isInline(node: GoNode): node is GoInline {
  return node.type === "inline";
}

export function isBlock(node: GoNode): node is GoBlock {
  return node.type === "block";
}

export function isMultiBlock(node: GoNode): node is GoMultiBlock {
  return node.type === "double-block";
}

export function isRoot(node: GoNode): node is GoRoot {
  return node.type === "root";
}

export function isUnformattable(node: GoNode): node is GoRoot {
  return node.type === "unformattable";
}
