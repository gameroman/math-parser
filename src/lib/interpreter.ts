import type { Token } from "./parser";

/**
 * Recursive-descent style interpreter/evaluator.
 */
export function evaluate(tokens: Token[]): number {
  let pos = 0;

  function parseExpression(): number {
    let value = parseTerm();

    while (pos < tokens.length) {
      const token = tokens[pos];
      if (token?.type === "PLUS") {
        pos++;
        value += parseTerm();
      } else if (token?.type === "MINUS") {
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
      if (token?.type === "MUL") {
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
      throw new Error("Unexpected end of expression (expected a number)");
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
    const value = token.value;
    pos++;
    return value;
  }

  const result = parseExpression();

  if (pos < tokens.length) {
    throw new Error("Unexpected tokens after end of expression");
  }

  return result;
}
