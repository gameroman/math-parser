import type { Token } from "./parser";

/**
 * Converts an array of tokens into a string expression.
 */
export function serialize(tokens: Token[]): string {
  return tokens.reduce((acc, token, i) => {
    let segment = "";

    switch (token.type) {
      case "NUMBER":
        segment = token.value.toString();
        break;
      case "PLUS":
        segment = "+";
        break;
      case "MINUS":
        segment = "-";
        break;
      case "MUL":
        segment = "*";
        break;
      case "LPAREN":
        segment = "(";
        break;
      case "RPAREN":
        segment = ")";
        break;
      default:
        return acc;
    }

    if (i === 0) return segment;

    const prev = tokens[i - 1];

    // No space after '(' or before ')'
    if (prev?.type === "LPAREN" || token.type === "RPAREN") {
      return `${acc}${segment}`;
    }

    // Unary logic (no space between sign and number/paren)
    if (
      (token.type === "PLUS" || token.type === "MINUS") &&
      prev?.type !== "NUMBER" &&
      prev?.type !== "RPAREN"
    ) {
      return `${acc} ${segment}`;
    }

    if (
      (token.type === "NUMBER" || token.type === "LPAREN") &&
      (prev?.type === "PLUS" || prev?.type === "MINUS")
    ) {
      const grandPrev = tokens[i - 2];
      if (
        !grandPrev ||
        (grandPrev.type !== "NUMBER" && grandPrev.type !== "RPAREN")
      ) {
        return `${acc}${segment}`;
      }
    }

    return `${acc} ${segment}`;
  }, "");
}
