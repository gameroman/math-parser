import type { TransformedToken } from "./transformer";
import {
  InterpreterError,
  UnexpectedEndOfExpressionError,
  MismatchedParenthesisError,
  InsufficientOperandsError,
} from "./errors";

const precedence = {
  "+": 1,
  "-": 1,
  "*": 2,
  UNARY_PLUS: 3,
  UNARY_MINUS: 3,
  "(": 0,
} as const;

type StackOp = keyof typeof precedence;

export function evaluate(tokens: TransformedToken[]): number {
  if (tokens.length === 0) return 0;

  const values: number[] = [];
  const ops: StackOp[] = [];

  const applyOp = (pos?: number) => {
    const op = ops.pop();
    if (!op || op === "(") return;

    // Handle Unary
    if (op === "UNARY_PLUS" || op === "UNARY_MINUS") {
      const val = values.pop();
      if (val === undefined) throw new UnexpectedEndOfExpressionError();
      values.push(op === "UNARY_MINUS" ? -val : val);
      return;
    }

    // Handle Binary
    const right = values.pop();
    const left = values.pop();

    if (right === undefined || left === undefined) {
      throw new InsufficientOperandsError(pos);
    }

    if (op === "+") values.push(left + right);
    else if (op === "-") values.push(left - right);
    else if (op === "*") values.push(left * right);
  };

  const pushOpWithPrecedence = (currentOp: StackOp, pos: number) => {
    const isUnary = currentOp === "UNARY_PLUS" || currentOp === "UNARY_MINUS";

    while (
      ops.length > 0 &&
      (isUnary
        ? precedence[ops[ops.length - 1]!] > precedence[currentOp]
        : precedence[ops[ops.length - 1]!] >= precedence[currentOp])
    ) {
      applyOp(pos);
    }
    ops.push(currentOp);
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) throw new UnexpectedEndOfExpressionError();
    const prevToken = tokens[i - 1];

    // --- 1. Handle Implicit Multiplication ---
    // (e.g., 2(3) or (2)3)
    if (
      prevToken &&
      ((token.type === "LPAREN" &&
        (prevToken.type === "NUMBER" || prevToken.type === "RPAREN")) ||
        (token.type === "NUMBER" && prevToken.type === "RPAREN"))
    ) {
      pushOpWithPrecedence("*", token.pos);
    }

    // --- 2. Shunting-Yard Logic ---
    switch (token.type) {
      case "NUMBER":
        values.push(token.value);
        break;

      case "LPAREN":
        ops.push("(");
        break;

      case "RPAREN": {
        let foundMatch = false;
        while (ops.length > 0) {
          if (ops[ops.length - 1] === "(") {
            foundMatch = true;
            break;
          }
          applyOp(token.pos);
        }
        if (!foundMatch) throw new MismatchedParenthesisError(token.pos);
        ops.pop(); // Remove '('
        break;
      }

      case "PLUS":
        pushOpWithPrecedence("+", token.pos);
        break;
      case "MINUS":
        pushOpWithPrecedence("-", token.pos);
        break;
      case "MUL":
        pushOpWithPrecedence("*", token.pos);
        break;
      case "UNARY_PLUS":
        pushOpWithPrecedence("UNARY_PLUS", token.pos);
        break;
      case "UNARY_MINUS":
        pushOpWithPrecedence("UNARY_MINUS", token.pos);
        break;
    }
  }

  // --- 3. Finalization ---
  while (ops.length > 0) {
    const top = ops[ops.length - 1];
    const lastPos = tokens[tokens.length - 1]?.pos ?? 0;
    if (top === "(")
      throw new MismatchedParenthesisError(lastPos, "Missing closing ')'");
    applyOp(lastPos);
  }

  if (values.length !== 1) {
    throw new InterpreterError(
      "Incomplete expression",
      tokens[tokens.length - 1]?.pos,
    );
  }

  return values[0]!;
}
