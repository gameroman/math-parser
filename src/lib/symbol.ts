import type { TransformedToken } from "./transformer";

const symbolMap = {
  PLUS: "+",
  UNARY_PLUS: "+",
  MINUS: "-",
  UNARY_MINUS: "-",
  MUL: "*",
  LPAREN: "(",
  RPAREN: ")",
} satisfies Record<string, string>;

export const getSym = (t: TransformedToken): string =>
  t.type === "NUMBER" ? t.value.toString() : symbolMap[t.type];
