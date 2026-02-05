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
      default:
        return acc;
    }

    if (i === 0) return segment;

    const prevToken = tokens[i - 1];

    // Unary logic: If this is a PLUS/MINUS and the previous token
    // wasn't a number, don't add a space.
    if (
      (token.type === "PLUS" || token.type === "MINUS") &&
      prevToken?.type !== "NUMBER"
    ) {
      return `${acc} ${segment}`;
    }

    // If the CURRENT token is a number and the PREVIOUS was a unary operator,
    // attach them without a space.
    if (
      token.type === "NUMBER" &&
      (prevToken?.type === "PLUS" || prevToken?.type === "MINUS")
    ) {
      const grandPrev = tokens[i - 2];
      if (!grandPrev || grandPrev.type !== "NUMBER") {
        return `${acc}${segment}`;
      }
    }

    return `${acc} ${segment}`;
  }, "");
}
