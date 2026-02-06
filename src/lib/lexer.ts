import { LexerError } from "./errors";

interface TokenBase {
  pos: number;
}

export interface TokenNumber extends TokenBase {
  type: "NUMBER";
  whole: string;
  fraction?: string;
}

export type Token =
  | TokenNumber
  | { type: "PLUS"; pos: number }
  | { type: "MINUS"; pos: number }
  | { type: "MUL"; pos: number }
  | { type: "DIV"; pos: number }
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

export interface LexerOptions {
  decimalSeparator?: "." | ",";
}

/**
 * Simple lexer (tokenizer).
 */
export function tokenize(
  expression: string,
  options: LexerOptions = {},
): Token[] {
  const { decimalSeparator = "." } = options;
  const tokens: Token[] = [];
  let index = 0;
  const length = expression.length;

  while (index < length) {
    const ch = expression[index];
    const startPos = index;

    if (isWhitespace(ch)) {
      index++;
      continue;
    }

    if (isDigit(ch) || ch === decimalSeparator) {
      let whole = "";
      let fraction: string | undefined = undefined;

      // Handle implicit whole part (e.g., ".1")
      if (ch === decimalSeparator) {
        whole = "0";
        index++; // Skip the separator

        const fracStart = index;
        let fracBuffer = "";
        while (index < length && isDigit(expression[index])) {
          fracBuffer += expression[index];
          index++;
        }

        // Check for decimal separator within fractional part (e.g., "1.2." or ".1.2")
        if (index < length && expression[index] === decimalSeparator) {
          throw new LexerError(`Invalid decimal number format`, index);
        }

        if (index === fracStart) {
          throw new LexerError(`Expected digit after decimal separator`, index);
        }
        fraction = fracBuffer;
      } else {
        // Parse whole part
        while (index < length && isDigit(expression[index])) {
          whole += expression[index];
          index++;
        }

        // Parse fractional part
        if (index < length && expression[index] === decimalSeparator) {
          // Check for consecutive decimal separators (e.g., "1..2")
          if (
            index + 1 < length &&
            expression[index + 1] === decimalSeparator
          ) {
            throw new LexerError(`Invalid decimal number format`, index);
          }
          index++; // Skip the separator

          const fracStart = index;
          let fracBuffer = "";
          while (index < length && isDigit(expression[index])) {
            fracBuffer += expression[index];
            index++;
          }

          if (index === fracStart) {
            fraction = "0";
          } else {
            fraction = fracBuffer;
          }
        }
      }

      tokens.push({ type: "NUMBER", whole, fraction, pos: startPos });
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

    if (ch === "/") {
      tokens.push({ type: "DIV", pos: startPos });
      index++;
      continue;
    }

    throw new LexerError(`Unexpected character '${ch}'`, index);
  }

  return tokens;
}
