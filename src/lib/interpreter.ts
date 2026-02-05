import type { Token } from "./parser";

class UnexpectedEndOfExpressionError extends Error {
  constructor() {
    super("Unexpected end of expression");
  }
}

/**
 * Consolidated Shunting-Yard Evaluator.
 */
export function evaluate(tokens: Token[]): number {
  const values: number[] = [];
  const ops: ("+" | "-" | "*" | "(" | "UNARY_PLUS" | "UNARY_MINUS")[] = [];

  const precedence = {
    "+": 1,
    "-": 1,
    "*": 2,
    UNARY_PLUS: 3,
    UNARY_MINUS: 3,
    "(": 0,
  };

  function applyOp() {
    const op = ops.pop();
    if (!op) return;
    if (op === "UNARY_PLUS") return;
    if (op === "UNARY_MINUS") {
      const val = values.pop()!;
      values.push(-val);
      return;
    }

    const right = values.pop()!;
    const left = values.pop()!;

    if (op === "+") values.push(left + right);
    if (op === "-") values.push(left - right);
    if (op === "*") values.push(left * right);
  }

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    const prevToken = tokens[i - 1];
    if (!token) throw new UnexpectedEndOfExpressionError();

    // --- Handle Implicit Multiplication Detection ---
    // If current is '(' and previous was a NUMBER or ')'
    // OR if current is NUMBER and previous was ')'
    if (
      prevToken &&
      ((token.type === "LPAREN" &&
        (prevToken.type === "NUMBER" || prevToken.type === "RPAREN")) ||
        (token.type === "NUMBER" && prevToken.type === "RPAREN"))
    ) {
      const currentOp = "*";
      while (
        ops.length &&
        precedence[ops[ops.length - 1]!] >= precedence[currentOp]
      ) {
        applyOp();
      }
      ops.push(currentOp);
    }

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
