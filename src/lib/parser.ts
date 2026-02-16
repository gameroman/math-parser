import type { Token } from "./lexer";

import { IncompleteExpressionError, MathSyntaxError } from "./errors";
import { getSym } from "./symbol";

export type UnaryToken =
  | { type: "UNARY_PLUS"; pos: number }
  | { type: "UNARY_MINUS"; pos: number };

export type ImplicitMulToken = { type: "IMPLICIT_MUL"; pos: number };

export type ParsedToken = Token | UnaryToken | ImplicitMulToken;

function isThisUnaryToken(prev?: Token) {
  // A '+' or '-' is unary if it's at the start or follows an operator/paren
  return (
    !prev ||
    prev.type === "LPAREN" ||
    ["PLUS", "MINUS", "MUL", "DIV", "POW"].includes(prev.type)
  );
}

export function parse(tokens: Token[]): ParsedToken[] {
  if (tokens.length === 0) return [];

  const result: ParsedToken[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const prev = tokens[i - 1];

    // --- Implicit Multiplication ---
    if (prev) {
      const isImplicit =
        (prev.type === "NUMBER" && token.type === "LPAREN") ||
        (prev.type === "RPAREN" && token.type === "LPAREN") ||
        (prev.type === "RPAREN" && token.type === "NUMBER") ||
        (prev.type === "FACTORIAL" && token.type === "NUMBER") ||
        (prev.type === "FACTORIAL" && token.type === "LPAREN");

      if (isImplicit) {
        result.push({ type: "IMPLICIT_MUL", pos: token.pos });
      }
    }

    // --- Syntax Validation ---
    if (["MUL", "DIV", "POW"].includes(token.type)) {
      if (isThisUnaryToken(prev)) {
        throw new MathSyntaxError(
          `Unexpected operator '${getSym(token)}'`,
          token.pos,
        );
      }
    }

    if (token.type === "FACTORIAL") {
      if (
        !prev ||
        ["PLUS", "MINUS", "MUL", "DIV", "POW", "LPAREN"].includes(prev.type)
      ) {
        throw new MathSyntaxError("Unexpected factorial operator", token.pos);
      }
    }

    if (prev && token.type === "NUMBER" && prev.type === "NUMBER") {
      throw new MathSyntaxError("Missing operator between numbers", token.pos);
    }

    // You can't have '()' with nothing inside
    if (token.type === "RPAREN" && prev?.type === "LPAREN") {
      throw new MathSyntaxError("Unexpected ')' after '('", token.pos);
    }

    // --- Unary Identification ---
    if (
      (token.type === "PLUS" || token.type === "MINUS") &&
      isThisUnaryToken(prev)
    ) {
      result.push({
        type: token.type === "PLUS" ? "UNARY_PLUS" : "UNARY_MINUS",
        pos: token.pos,
      });
    } else {
      result.push(token);
    }
  }

  // --- Trailing Operator Validation ---
  const last = result[result.length - 1];
  if (last && ["PLUS", "MINUS", "MUL", "DIV", "POW"].includes(last.type)) {
    throw new IncompleteExpressionError(
      `trailing operator '${getSym(last)}'`,
      last.pos,
    );
  }

  return result;
}
