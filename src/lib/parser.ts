export type Token =
  | { type: "NUMBER"; value: number }
  | { type: "PLUS" }
  | { type: "MINUS" }
  | { type: "MUL" }
  | { type?: never };

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

function isWhitespace(ch?: string): ch is " " {
  return ch === " ";
}

function isDigit(ch?: string): ch is Digit {
  if (ch === undefined) return false;
  if (ch.length !== 1) return false;
  return ch >= "0" && ch <= "9";
}

/**
 * Simple lexer (tokenizer).
 */
export function parse(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const length = expression.length;

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
