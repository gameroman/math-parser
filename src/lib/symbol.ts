import type { Token, TokenNumber } from "./lexer";
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
  ABS_CLOSE: "|",
  ABS_OPEN: "|",
  PIPE: "|",
} satisfies Record<
  Exclude<(Token | ParsedToken)["type"], "NUMBER" | "FUNC" | "CONST">,
  string
>;

export const prettifyNumber = (t: TokenNumber) =>
  t.fraction ? `${t.whole}.${t.fraction}` : t.whole;

export function getSym(
  t: Exclude<ParsedToken | Token, { type: "FUNC" }>,
): string {
  if (t.type === "NUMBER") return prettifyNumber(t);
  if (t.type === "CONST") return t.id;
  return symbolMap[t.type];
}
