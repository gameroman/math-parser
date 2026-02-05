import type { Token } from "./parser";

// --- Custom Errors ---

export class InterpreterError extends Error {
  constructor(
    message: string,
    public pos?: number,
  ) {
    super(pos !== undefined ? `${message} at position ${pos}` : message);
    this.name = this.constructor.name;
  }
}

export class UnexpectedEndOfExpressionError extends InterpreterError {
  constructor() {
    super("Unexpected end of expression");
  }
}

export class MismatchedParenthesisError extends InterpreterError {
  constructor(pos: number, message = "Mismatched parenthesis") {
    super(message, pos);
  }
}

export class MathSyntaxError extends InterpreterError {
  constructor(message: string, pos: number) {
    super(`Syntax Error: ${message}`, pos);
  }
}

export class InsufficientOperandsError extends InterpreterError {
  constructor(pos?: number) {
    super("Insufficient operands for operation", pos);
  }
}

// --- Evaluator ---

const precedence = {
  "+": 1,
  "-": 1,
  "*": 2,
  UNARY_PLUS: 3,
  UNARY_MINUS: 3,
  "(": 0,
} as const;

type StackOp = keyof typeof precedence;

export function evaluate(tokens: Token[]): number {
  if (tokens.length === 0) return 0;

  const values: number[] = [];
  const ops: StackOp[] = [];

  const symbolMap: Record<string, string> = {
    PLUS: "+",
    MINUS: "-",
    MUL: "*",
    LPAREN: "(",
    RPAREN: ")",
  };
  const getSym = (t: Token) =>
    t.type === "NUMBER" ? t.value.toString() : symbolMap[t.type];

  const applyOp = (pos?: number) => {
    const op = ops.pop();
    if (!op || op === "(" || op === "UNARY_PLUS") return;

    if (op === "UNARY_MINUS") {
      const val = values.pop();
      if (val === undefined) throw new UnexpectedEndOfExpressionError();
      values.push(-val);
      return;
    }

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
    while (
      ops.length > 0 &&
      precedence[ops[ops.length - 1]!] >= precedence[currentOp]
    ) {
      applyOp(pos);
    }
    ops.push(currentOp);
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) throw new UnexpectedEndOfExpressionError();
    const prevToken = tokens[i - 1];

    // --- 1. Refined Sequence Validation ---
    if (prevToken) {
      const prevIsOp = ["PLUS", "MINUS", "MUL"].includes(prevToken.type);

      // Specifically block binary-only operators from following an operator
      // We allow PLUS/MINUS here because they will be handled as Unary later
      if (prevIsOp && token.type === "MUL") {
        throw new MathSyntaxError(`Unexpected operator '*'`, token.pos);
      }

      if (
        prevToken.type === "LPAREN" &&
        (token.type === "RPAREN" || token.type === "MUL")
      ) {
        throw new MathSyntaxError(
          `Unexpected '${getSym(token)}' after '('`,
          token.pos,
        );
      }
    }

    // --- 2. Handle Implicit Multiplication ---
    if (
      prevToken &&
      ((token.type === "LPAREN" &&
        (prevToken.type === "NUMBER" || prevToken.type === "RPAREN")) ||
        (token.type === "NUMBER" && prevToken.type === "RPAREN"))
    ) {
      pushOpWithPrecedence("*", token.pos);
    }

    // --- 3. Shunting-Yard Logic ---
    if (token.type === "NUMBER") {
      values.push(token.value);
    } else if (token.type === "LPAREN") {
      ops.push("(");
    } else if (token.type === "RPAREN") {
      let foundMatch = false;
      while (ops.length > 0) {
        if (ops[ops.length - 1] === "(") {
          foundMatch = true;
          break;
        }
        applyOp(token.pos);
      }
      if (!foundMatch) throw new MismatchedParenthesisError(token.pos);
      ops.pop();
    } else {
      // Determine if Unary or Binary
      const isUnary =
        !prevToken ||
        prevToken.type === "LPAREN" ||
        ["PLUS", "MINUS", "MUL"].includes(prevToken.type);

      let currentOp: StackOp;
      if (isUnary) {
        if (token.type === "PLUS") currentOp = "UNARY_PLUS";
        else if (token.type === "MINUS") currentOp = "UNARY_MINUS";
        else throw new MathSyntaxError("Unexpected '*'", token.pos);
      } else {
        currentOp =
          token.type === "PLUS" ? "+" : token.type === "MINUS" ? "-" : "*";
      }

      pushOpWithPrecedence(currentOp, token.pos);
    }
  }

  // --- 4. Finalization ---
  const lastToken = tokens[tokens.length - 1];
  if (lastToken && ["PLUS", "MINUS", "MUL"].includes(lastToken.type)) {
    // Note: This logic only works if you ensure the last token wasn't actually
    // a unary operator (like "5 + -"). But for a simple binary trailing check:
    const prevToLast = tokens[tokens.length - 2];
    const isActuallyBinary =
      prevToLast &&
      (prevToLast.type === "NUMBER" || prevToLast.type === "RPAREN");

    if (isActuallyBinary || lastToken.type === "MUL") {
      throw new MathSyntaxError(
        `Incomplete expression: trailing operator '${getSym(lastToken)}'`,
        lastToken.pos,
      );
    }
  }

  while (ops.length > 0) {
    const top = ops[ops.length - 1];
    const lastPos = tokens[tokens.length - 1]?.pos ?? 0;
    if (top === "(")
      throw new MismatchedParenthesisError(lastPos, "Missing closing ')'");
    applyOp(lastPos);
  }

  if (values.length !== 1) {
    // Check if we ended on an operator
    const lastToken = tokens[tokens.length - 1];
    if (lastToken && ["PLUS", "MINUS", "MUL"].includes(lastToken.type)) {
      throw new MathSyntaxError(
        `Incomplete expression: trailing operator '${getSym(lastToken)}'`,
        lastToken.pos,
      );
    }
    throw new InterpreterError("Incomplete expression");
  }

  return values[0]!;
}
