import type { Token } from "./lexer";

import { IncompleteExpressionError, MathSyntaxError } from "./errors";
import { getSym } from "./symbol";

export type UnaryToken =
  | { type: "UNARY_PLUS"; pos: number }
  | { type: "UNARY_MINUS"; pos: number };

export type TransformedToken = Token | UnaryToken;

export function applyUnaryTransformation(tokens: Token[]): TransformedToken[] {
  if (tokens.length === 0) return [];

  const result: TransformedToken[] = tokens.map((token, i) => {
    const prev = tokens[i - 1];

    // --- 1. Syntax Validation ---

    // '*' cannot be at the start, after '(', or after another operator
    if (token.type === "MUL") {
      if (
        !prev ||
        prev.type === "LPAREN" ||
        ["PLUS", "MINUS", "MUL"].includes(prev.type)
      ) {
        throw new MathSyntaxError("Unexpected operator '*'", token.pos);
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

    const isUnary =
      !prev ||
      prev.type === "LPAREN" ||
      ["PLUS", "MINUS", "MUL"].includes(prev.type);

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
  if (last && ["PLUS", "MINUS", "MUL"].includes(last.type)) {
    // Note: UNARY tokens are fine at the end (e.g., "5 + -"),
    // but binary ones aren't ("5 +").
    throw new IncompleteExpressionError(
      `trailing operator '${getSym(last)}'`,
      last.pos,
    );
  }

  return result;
}
