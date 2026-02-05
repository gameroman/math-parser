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
  const values: number[] = [];
  const ops: ("+" | "-" | "*" | "(" | "UNARY_PLUS" | "UNARY_MINUS")[] = [];

  const precedence = {
    "+": 1,
    "-": 1,
    "*": 2,
    UNARY_PLUS: 3,
    UNARY_MINUS: 3, // Higher precedence than multiplication
    "(": 0,
  };

  function applyOp() {
    const op = ops.pop();
    if (op === "UNARY_PLUS") return; // +5 is just 5
    if (op === "UNARY_MINUS") {
      const val = values.pop()!;
      values.push(-val);
      return;
    }

    const right = values.pop()!;
    const left = values.pop()!; // Binary always has two operands

    if (op === "+") values.push(left + right);
    if (op === "-") values.push(left - right);
    if (op === "*") values.push(left * right);
  }

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    const prevToken = tokens[i - 1];
    if (!token) throw new UnexpectedEndOfExpressionError();

    if (token.type === "NUMBER") {
      values.push(token.value);
    } else if (token.type === "LPAREN") {
      ops.push("(");
    } else if (token.type === "RPAREN") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        applyOp();
      }
      ops.pop();
    } else {
      // Determine if this is a unary or binary operator
      const isUnary =
        !prevToken ||
        prevToken.type === "LPAREN" ||
        prevToken.type === "PLUS" ||
        prevToken.type === "MINUS" ||
        prevToken.type === "MUL";

      let currentOp: keyof typeof precedence;
      if (isUnary && token.type === "PLUS") currentOp = "UNARY_PLUS";
      else if (isUnary && token.type === "MINUS") currentOp = "UNARY_MINUS";
      else if (token.type === "PLUS") currentOp = "+";
      else if (token.type === "MINUS") currentOp = "-";
      else currentOp = "*";

      while (
        ops.length &&
        precedence[ops[ops.length - 1]!] >= precedence[currentOp]
      ) {
        applyOp();
      }
      ops.push(currentOp);
    }
    i++;
  }

  while (ops.length) {
    applyOp();
  }

  return values[0] ?? 0;
}
