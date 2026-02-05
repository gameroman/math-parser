type Token =
  | { type: "NUMBER"; value: number }
  | { type: "PLUS" }
  | { type: "MINUS" }
  | { type: "MUL" }
  | { type?: never };

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

/**
 * Simple lexer (tokenizer).
 */
export function lexer(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const length = expression.length;

  function isWhitespace(ch?: string): ch is " " {
    return ch === " ";
  }

  function isDigit(ch?: string): ch is Digit {
    if (ch === undefined) return false;
    if (ch.length !== 1) return false;
    return ch >= "0" && ch <= "9";
  }

  while (index < length) {
    const ch = expression[index];

    if (isWhitespace(ch)) {
      index++;
      continue;
    }

    if (isDigit(ch)) {
      let value = 0;
      while (index < length) {
        const d = expression[index];
        if (!isDigit(d)) break;
        const digit = d.charCodeAt(0) - "0".charCodeAt(0);
        value = value * 10 + digit;
        index++;
      }
      tokens.push({ type: "NUMBER", value });
      continue;
    }

    if (ch === "+") {
      tokens.push({ type: "PLUS" });
      index++;
      continue;
    }

    if (ch === "-") {
      tokens.push({ type: "MINUS" });
      index++;
      continue;
    }

    if (ch === "*") {
      tokens.push({ type: "MUL" });
      index++;
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at position ${index}`);
  }

  return tokens;
}
/**
 * Recursive-descent style parser/evaluator.
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
