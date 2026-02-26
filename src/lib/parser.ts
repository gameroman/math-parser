import { IncompleteExpressionError, ParserError } from "./errors";
import type { Token, TokenBase } from "./lexer";
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

type TokenType = (Token | ParsedToken)["type"];

/**
 * Helper: Is the last token an "operand" (something that can be followed by a closing pipe or implicit mul)?
 */
function isOperand(last?: ParsedToken) {
  if (!last) return false;
  return (
    last.type === "NUMBER" ||
    last.type === "CONST" ||
    last.type === "RPAREN" ||
    last.type === "ABS_CLOSE" ||
    last.type === "FACTORIAL"
  );
}

/**
 * Helper: Does the current context allow a +/- to be unary?
 */
function isUnaryContext(last?: ParsedToken) {
  return !isOperand(last);
}

export function parse(tokens: Token[]): ParsedToken[] {
  if (tokens.length === 0) return [];

  const result: ParsedToken[] = [];
  let absStack = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const prev = tokens[i - 1];
    let prevParsed = result[result.length - 1];

    // --- Handle Pipes ---
    if (token.type === "PIPE") {
      const isClosing = absStack > 0 && isOperand(prevParsed);

      if (isClosing) {
        result.push({ type: "ABS_CLOSE", pos: token.pos });
        absStack--;
      } else {
        if (isOperand(prevParsed)) {
          result.push({ type: "IMPLICIT_MUL", pos: token.pos });
        }
        result.push({ type: "ABS_OPEN", pos: token.pos });
        absStack++;
      }
      continue;
    }

    // --- Iplicit Multiplication ---
    if (isOperand(result[result.length - 1])) {
      const needsImplicit =
        token.type === "LPAREN" ||
        token.type === "FUNC" ||
        token.type === "NUMBER" ||
        token.type === "CONST";

      if (needsImplicit) {
        result.push({ type: "IMPLICIT_MUL", pos: token.pos });
      }
    }

    prevParsed = result[result.length - 1];

    // --- Syntax Validation ---
    if (token.type === "MUL" || token.type === "DIV" || token.type === "POW") {
      if (isUnaryContext(prevParsed)) {
        throw new ParserError(
          `Unexpected operator '${getSym(token)}'`,
          token.pos,
        );
      }
    }

    if (token.type === "FACTORIAL") {
      if (!isOperand(prevParsed) && prevParsed?.type !== "RPAREN") {
        throw new ParserError("Unexpected factorial operator", token.pos);
      }
    }

    if (
      prev &&
      (prev.type === "NUMBER" || prev.type === "CONST") &&
      token.type === "NUMBER"
    ) {
      throw new ParserError("Missing operator between numbers", token.pos);
    }

    if (token.type === "RPAREN" && prevParsed?.type === "LPAREN") {
      throw new ParserError("Unexpected ')' after '('", token.pos);
    }

    // --- Unary Identification ---
    if (
      (token.type === "PLUS" || token.type === "MINUS") &&
      isUnaryContext(prevParsed)
    ) {
      result.push({
        type: token.type === "PLUS" ? "UNARY_PLUS" : "UNARY_MINUS",
        pos: token.pos,
      });
    } else {
      result.push(token);
    }
  }

  // --- Final State Validation ---
  if (absStack > 0) {
    throw new ParserError(
      "Unclosed absolute value '|'",
      result[result.length - 1]?.pos ?? 0,
    );
  }

  const last = result[result.length - 1];
  const trailingOperators: TokenType[] = [
    "PLUS",
    "MINUS",
    "MUL",
    "DIV",
    "POW",
    "UNARY_PLUS",
    "UNARY_MINUS",
    "FUNC",
    "ABS_OPEN",
  ];

  if (last && trailingOperators.includes(last.type)) {
    if (last.type === "FUNC") {
      throw new IncompleteExpressionError(
        `trailing function '${last}'`,
        last.pos,
      );
    }
    throw new IncompleteExpressionError(
      `trailing operator '${getSym(last)}'`,
      last.pos,
    );
  }

  return result;
}
