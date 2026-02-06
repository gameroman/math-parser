import type { TransformedToken } from "./transformer";

import {
  UnexpectedEndOfExpressionError,
  MismatchedParenthesisError,
  InsufficientOperandsError,
  EmptyExpressionError,
  MaximumPrecisionError,
} from "./errors";

const precedence = {
  ADD: 1,
  SUBTRACT: 1,
  MULTIPLY: 2,
  UNARY_PLUS: 3,
  UNARY_MINUS: 3,
  LPAREN: 0,
} as const;

type StackOp = keyof typeof precedence;

export type HighPrecision = {
  value: bigint;
  scale: number;
};

function isUnaryOperation(op: StackOp) {
  return op === "UNARY_PLUS" || op === "UNARY_MINUS";
}

const MAX_PRECISION = 200_000;

/**
 * Normalizes two high-precision numbers to the same scale.
 */
function alignScales(
  a: HighPrecision,
  b: HighPrecision,
): [bigint, bigint, number] {
  const maxScale = Math.max(a.scale, b.scale);
  if (maxScale > MAX_PRECISION) {
    throw new MaximumPrecisionError(maxScale, MAX_PRECISION);
  }
  const aVal = a.value * 10n ** BigInt(maxScale - a.scale);
  const bVal = b.value * 10n ** BigInt(maxScale - b.scale);
  return [aVal, bVal, maxScale];
}

export function evaluate(tokens: TransformedToken[]): HighPrecision {
  if (tokens.length === 0) {
    throw new EmptyExpressionError();
  }

  const values: HighPrecision[] = [];
  const ops: StackOp[] = [];

  const applyOp = (pos?: number) => {
    const op = ops.pop();
    if (!op || op === "LPAREN") return;

    if (isUnaryOperation(op)) {
      const val = values.pop();
      if (val === undefined) throw new UnexpectedEndOfExpressionError();
      values.push({
        value: op === "UNARY_MINUS" ? -val.value : val.value,
        scale: val.scale,
      });
      return;
    }

    const right = values.pop();
    const left = values.pop();

    if (right === undefined || left === undefined) {
      throw new InsufficientOperandsError(pos);
    }

    if (op === "ADD") {
      const [l, r, scale] = alignScales(left, right);
      values.push({ value: l + r, scale });
    } else if (op === "SUBTRACT") {
      const [l, r, scale] = alignScales(left, right);
      values.push({ value: l - r, scale });
    } else if (op === "MULTIPLY") {
      values.push({
        value: left.value * right.value,
        scale: left.scale + right.scale,
      });
    }
  };

  const pushOpWithPrecedence = (currentOp: StackOp, pos: number) => {
    const isUnary = isUnaryOperation(currentOp);

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

    // Implicit Multiplication logic
    if (
      prevToken &&
      ((token.type === "LPAREN" &&
        (prevToken.type === "NUMBER" || prevToken.type === "RPAREN")) ||
        (token.type === "NUMBER" && prevToken.type === "RPAREN"))
    ) {
      pushOpWithPrecedence("MULTIPLY", token.pos);
    }

    switch (token.type) {
      case "NUMBER": {
        const frac = token.fraction || "";
        values.push({
          value: BigInt(token.whole + frac),
          scale: frac.length,
        });
        break;
      }
      case "LPAREN": {
        ops.push("LPAREN");
        break;
      }
      case "RPAREN": {
        let foundMatch = false;
        while (ops.length > 0) {
          if (ops[ops.length - 1] === "LPAREN") {
            foundMatch = true;
            break;
          }
          applyOp(token.pos);
        }
        if (!foundMatch) throw new MismatchedParenthesisError(token.pos);
        ops.pop();
        break;
      }
      case "PLUS": {
        pushOpWithPrecedence("ADD", token.pos);
        break;
      }
      case "MINUS": {
        pushOpWithPrecedence("SUBTRACT", token.pos);
        break;
      }
      case "MUL": {
        pushOpWithPrecedence("MULTIPLY", token.pos);
        break;
      }
      case "UNARY_PLUS": {
        pushOpWithPrecedence("UNARY_PLUS", token.pos);
        break;
      }
      case "UNARY_MINUS": {
        pushOpWithPrecedence("UNARY_MINUS", token.pos);
        break;
      }
    }
  }

  while (ops.length > 0) {
    const top = ops[ops.length - 1];
    const lastPos = tokens[tokens.length - 1]?.pos ?? 0;
    if (top === "LPAREN") {
      throw new MismatchedParenthesisError(lastPos, "Missing closing ')'");
    }
    applyOp(lastPos);
  }

  const v = values[values.length - 1];
  if (!v) throw new UnexpectedEndOfExpressionError();

  return v;
}
