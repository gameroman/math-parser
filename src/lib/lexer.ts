import { LexerError } from "./errors";

export interface TokenBase {
  pos: number;
}

export interface TokenNumber extends TokenBase {
  type: "NUMBER";
  whole: string;
  fraction?: string;
  exponent?: string;
}

interface TokenFn extends TokenBase {
  type: "FUNC";
  id: string;
}

interface TokenFnAbs extends TokenFn {
  id: "abs";
}

export interface TokenConst extends TokenBase {
  type: "CONST";
  id: "pi" | "e";
}

export type Token =
  | TokenNumber
  | { type: "PLUS"; pos: number }
  | { type: "MINUS"; pos: number }
  | { type: "MUL"; pos: number }
  | { type: "DIV"; pos: number }
  | { type: "POW"; pos: number }
  | { type: "FACTORIAL"; pos: number }
  | { type: "PIPE"; pos: number }
  | { type: "LPAREN"; pos: number }
  | { type: "RPAREN"; pos: number }
  | TokenConst
  | TokenFnAbs;

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

function isWhitespace(ch?: string): ch is " " {
  return ch === " ";
}

function isDigit(ch?: string): ch is Digit {
  if (ch === undefined) return false;
  return ch >= "0" && ch <= "9";
}

function isAlpha(ch?: string): ch is string {
  if (ch === undefined) return false;
  return ch >= "a" && ch <= "z";
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
    const ch = expression[index]!;
    const startPos = index;

    if (isWhitespace(ch)) {
      index++;
      continue;
    }

    if (isDigit(ch) || ch === decimalSeparator) {
      let whole = "";
      let fraction: string | undefined = undefined;
      let exponent: string | undefined = undefined;

      if (ch === decimalSeparator) {
        whole = "0";
        index++;
        const fracStart = index;
        let fracBuffer = "";
        while (index < length && isDigit(expression[index])) {
          fracBuffer += expression[index];
          index++;
        }
        if (index === fracStart) {
          throw new LexerError("Expected digit after decimal separator", index);
        }
        fraction = fracBuffer;
      } else {
        while (index < length && isDigit(expression[index])) {
          whole += expression[index];
          index++;
        }
        if (index < length && expression[index] === decimalSeparator) {
          index++;
          let fracBuffer = "";
          const fracStart = index;
          while (index < length && isDigit(expression[index])) {
            fracBuffer += expression[index];
            index++;
          }
          fraction = index === fracStart ? "0" : fracBuffer;
        }
      }

      if (
        index < length &&
        (expression[index] === "e" || expression[index] === "E")
      ) {
        let lookahead = index + 1;
        let sign = "";

        const next = expression[lookahead];

        if (lookahead < length && (next === "+" || next === "-")) {
          sign = next;
          lookahead++;
        }

        if (lookahead < length && isDigit(expression[lookahead])) {
          index = lookahead;
          let expBuffer = sign;
          while (index < length && isDigit(expression[index])) {
            expBuffer += expression[index];
            index++;
          }
          exponent = expBuffer;
        }
      }

      // Final check for trailing separators
      if (index < length && expression[index] === decimalSeparator) {
        throw new LexerError("Invalid decimal number format", index);
      }

      tokens.push({ type: "NUMBER", whole, fraction, exponent, pos: startPos });
      continue;
    }

    if (isAlpha(ch)) {
      let id = "";
      while (index < length && isAlpha(expression[index])) {
        id += expression[index];
        index++;
      }

      if (id === "abs") {
        tokens.push({ type: "FUNC", id, pos: startPos });
        continue;
      }

      if (id === "pi" || id === "e") {
        tokens.push({ type: "CONST", id, pos: startPos });
        continue;
      }

      throw new LexerError(`Unknown identifier '${id}'`, startPos);
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

    if (ch === "^") {
      tokens.push({ type: "POW", pos: startPos });
      index++;
      continue;
    }

    if (ch === "!") {
      tokens.push({ type: "FACTORIAL", pos: startPos });
      index++;
      continue;
    }

    if (ch === "|") {
      tokens.push({ type: "PIPE", pos: startPos });
      index++;
      continue;
    }

    throw new LexerError(`Unexpected character '${ch}'`, index);
  }

  return tokens;
}
