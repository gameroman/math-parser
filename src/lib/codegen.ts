import type { Token } from "./lexer";

import { prettifyNumber } from "./symbol";

/**
 * Converts an array of tokens into a string expression.
 */
export function serialize(tokens: Token[]): string {
  return tokens.reduce((acc, token, i) => {
    let segment: string;

    switch (token.type) {
      case "NUMBER": {
        segment = prettifyNumber(token);
        break;
      }
      case "PLUS": {
        segment = "+";
        break;
      }
      case "MINUS": {
        segment = "-";
        break;
      }
      case "MUL": {
        segment = "*";
        break;
      }
      case "DIV": {
        segment = "/";
        break;
      }
      case "LPAREN": {
        segment = "(";
        break;
      }
      case "RPAREN": {
        segment = ")";
        break;
      }
      case "POW": {
        segment = "^";
        break;
      }
      case "FACTORIAL": {
        segment = "!";
        break;
      }
      case "PIPE": {
        segment = "|";
        break;
      }
      case "FUNC": {
        segment = token.id;
        break;
      }
    }

    if (i === 0) return segment;

    const prev = tokens[i - 1];
    const grandPrev = tokens[i - 2];

    // 1. Helper: Determine if the CURRENT token is a Unary Operator
    const isUnary =
      (token.type === "PLUS" || token.type === "MINUS") &&
      (!prev ||
        prev.type === "LPAREN" ||
        ["PLUS", "MINUS", "MUL"].includes(prev.type));

    // 2. Helper: Determine if the PREVIOUS token was a Unary Operator
    const prevWasUnary =
      prev &&
      (prev.type === "PLUS" || prev.type === "MINUS") &&
      (!grandPrev ||
        grandPrev.type === "LPAREN" ||
        ["PLUS", "MINUS", "MUL"].includes(grandPrev.type));

    // No space after '(' or before ')'
    if (prev?.type === "LPAREN" || token.type === "RPAREN") {
      return `${acc}${segment}`;
    }

    // No space after a Unary Operator (e.g., "-1" or "-(...)")
    if (prevWasUnary) {
      return `${acc}${segment}`;
    }

    // No space for implicit multiplication: 2(3) or (2)(3) or (2)3
    if (
      (token.type === "LPAREN" &&
        (prev?.type === "NUMBER" || prev?.type === "RPAREN")) ||
      (token.type === "NUMBER" && prev?.type === "RPAREN")
    ) {
      return `${acc}${segment}`;
    }

    // No space between stacked unary operators
    if (isUnary && prevWasUnary) {
      return `${acc}${segment}`;
    }

    return `${acc} ${segment}`;
  }, "");
}
