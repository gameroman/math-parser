import type { TokenNumber } from "./lexer";
import type { TransformedToken } from "./transformer";

const symbolMap = {
  PLUS: "+",
  UNARY_PLUS: "+",
  MINUS: "-",
  UNARY_MINUS: "-",
  MUL: "*",
  DIV: "/",
  LPAREN: "(",
  RPAREN: ")",
} satisfies Record<string, string>;

export const prettifyNumber = (t: TokenNumber) =>
  t.fraction ? `${t.whole}.${t.fraction}` : t.whole;

export const getSym = (t: TransformedToken): string =>
  t.type === "NUMBER" ? prettifyNumber(t) : symbolMap[t.type];
