import type { Token } from "./parser";

class UnexpectedEndOfExpressionError extends Error {
  constructor() {
    super("Unexpected end of expression");
  }
}

/**
 * Recursive-descent style interpreter/evaluator.
 */
export function evaluate(tokens: Token[]): number {
  let pos = 0;

  function parseExpression(): number {
    let value = parseTerm();

    while (pos < tokens.length) {
      const token = tokens[pos];
      if (!token) {
        throw new UnexpectedEndOfExpressionError();
      }

      if (token.type === "PLUS") {
        pos++;
        value += parseTerm();
      } else if (token.type === "MINUS") {
        pos++;
        value -= parseTerm();
      } else {
        break;
      }
    }

    return value;
  }

  function parseTerm(): number {
    let value = parsePrimary();

    while (pos < tokens.length) {
      const token = tokens[pos];
      if (!token) {
        throw new UnexpectedEndOfExpressionError();
      }

      if (token.type === "MUL") {
        pos++;
        value *= parsePrimary();
      } else {
        break;
      }
    }

    return value;
  }

  function parsePrimary(): number {
    const token = tokens[pos];
    if (!token) {
      throw new UnexpectedEndOfExpressionError();
    }

    if (token.type === "LPAREN") {
      pos++; // consume '('
      const value = parseExpression();
      if (tokens[pos]?.type !== "RPAREN") {
        throw new Error("Expected ')'");
      }
      pos++; // consume ')'
      return value;
    }

    if (token.type === "PLUS") {
      pos++;
      return parsePrimary();
    }

    if (token.type === "MINUS") {
      pos++;
      return -parsePrimary();
    }

    if (token.type !== "NUMBER") {
      throw new Error(`Expected a number but found '${token.type}'`);
    }

    pos++;
    return token.value;
  }

  const result = parseExpression();

  if (pos < tokens.length) {
    throw new Error("Unexpected tokens after end of expression");
  }

  return result;
}
