import type { Token } from "./lexer";

import { IncompleteExpressionError, MathSyntaxError } from "./errors";
import { getSym } from "./symbol";

export type UnaryToken =
  | { type: "UNARY_PLUS"; pos: number }
  | { type: "UNARY_MINUS"; pos: number };

export type ParsedToken = Token | UnaryToken;

function isThisUnaryToken(prev?: Token) {
  return (
    !prev ||
    prev.type === "LPAREN" ||
    ["PLUS", "MINUS", "MUL", "DIV"].includes(prev.type)
  );
}

export function parse(tokens: Token[]): ParsedToken[] {
  if (tokens.length === 0) return [];

  const result: ParsedToken[] = tokens.map((token, i) => {
    const prev = tokens[i - 1];

    // --- 1. Syntax Validation ---

    // '*' or '/' cannot be at the start, after '(', or after another operator
    if (token.type === "MUL" || token.type === "DIV") {
      if (isThisUnaryToken(prev)) {
        throw new MathSyntaxError(
          `Unexpected operator '${getSym(token)}'`,
          token.pos,
        );
      }
    }

    // You can't have '()' with nothing inside
    if (token.type === "RPAREN" && prev?.type === "LPAREN") {
      throw new MathSyntaxError("Unexpected ')' after '('", token.pos);
    }

    // --- 2. Unary Identification ---

    if (token.type !== "PLUS" && token.type !== "MINUS") {
      return token;
    }

    // A '+' or '-' is unary if it's at the start or follows an operator/paren
    const isUnary = isThisUnaryToken(prev);

    if (isUnary) {
      return {
        type: token.type === "PLUS" ? "UNARY_PLUS" : "UNARY_MINUS",
        pos: token.pos,
      };
    }

    return token;
  });

  // --- 3. Trailing Operator Validation ---

  const last = result[result.length - 1];
  if (last && ["PLUS", "MINUS", "MUL", "DIV"].includes(last.type)) {
    throw new IncompleteExpressionError(
      `trailing operator '${getSym(last)}'`,
      last.pos,
    );
  }

  return result;
}
