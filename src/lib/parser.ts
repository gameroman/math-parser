export type Token =
  | { type: "NUMBER"; value: number; pos: number }
  | { type: "PLUS"; pos: number }
  | { type: "MINUS"; pos: number }
  | { type: "MUL"; pos: number }
  | { type: "LPAREN"; pos: number }
  | { type: "RPAREN"; pos: number };

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
    const startPos = index; // Capture start of token

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
      tokens.push({ type: "NUMBER", value, pos: startPos });
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "LPAREN", pos: startPos });
      index++;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "RPAREN", pos: startPos });
      index++;
      continue;
    }

    if (ch === "+") {
      tokens.push({ type: "PLUS", pos: startPos });
      index++;
      continue;
    }

    if (ch === "-") {
      tokens.push({ type: "MINUS", pos: startPos });
      index++;
      continue;
    }

    if (ch === "*") {
      tokens.push({ type: "MUL", pos: startPos });
      index++;
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at position ${index}`);
  }

  return tokens;
}
