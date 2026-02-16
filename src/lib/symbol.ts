import type { TokenNumber } from "./lexer";
import type { ParsedToken } from "./parser";

const symbolMap = {
  PLUS: "+",
  UNARY_PLUS: "+",
  MINUS: "-",
  UNARY_MINUS: "-",
  MUL: "*",
  DIV: "/",
  LPAREN: "(",
  RPAREN: ")",
  POW: "^",
  IMPLICIT_MUL: "",
  FACTORIAL: "!",
} satisfies Record<Exclude<ParsedToken["type"], "NUMBER">, string>;

export const prettifyNumber = (t: TokenNumber) =>
  t.fraction ? `${t.whole}.${t.fraction}` : t.whole;

export const getSym = (t: ParsedToken): string =>
  t.type === "NUMBER" ? prettifyNumber(t) : symbolMap[t.type];
