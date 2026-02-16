import type { Token, TokenBase } from "./lexer";

import { IncompleteExpressionError, ParserError } from "./errors";
import { getSym } from "./symbol";

export interface UnaryToken extends TokenBase {
  type: "UNARY_PLUS" | "UNARY_MINUS";
}

export interface ImplicitMulToken extends TokenBase {
  type: "IMPLICIT_MUL";
}

interface AbsToken extends TokenBase {
  type: "ABS_OPEN" | "ABS_CLOSE";
}

export type ParsedToken =
  | Exclude<Token, { type: "PIPE" }>
  | UnaryToken
  | ImplicitMulToken
  | AbsToken;

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
    const prevParsed = result[result.length - 1];

    // --- Implicit Multiplication ---
    if (prev) {
      const isImplicitMultiplication =
        (prev.type === "NUMBER" && token.type === "LPAREN") ||
        (prev.type === "RPAREN" && token.type === "LPAREN") ||
        (prev.type === "RPAREN" && token.type === "NUMBER") ||
        (prev.type === "FACTORIAL" && token.type === "NUMBER") ||
        (prev.type === "FACTORIAL" && token.type === "LPAREN");

      if (isImplicitMultiplication) {
        result.push({ type: "IMPLICIT_MUL", pos: token.pos });
      }
    }

    // --- Syntax Validation ---
    if (["MUL", "DIV", "POW"].includes(token.type)) {
      if (isThisUnaryToken(prev)) {
        throw new ParserError(
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
        throw new ParserError("Unexpected factorial operator", token.pos);
      }
    }

    if (prev && token.type === "NUMBER" && prev.type === "NUMBER") {
      throw new ParserError("Missing operator between numbers", token.pos);
    }

    // You can't have '()' with nothing inside
    if (token.type === "RPAREN" && prev?.type === "LPAREN") {
      throw new ParserError("Unexpected ')' after '('", token.pos);
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
