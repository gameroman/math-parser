import type { ParsedToken } from "./parser";

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
  DIVIDE: 2,
  UNARY_PLUS: 3,
  UNARY_MINUS: 3,
  LPAREN: 0,
} as const;

type StackOp = keyof typeof precedence;

export type HighPrecision = {
  n: bigint; // Numerator
  d: bigint; // Denominator
};

/**
 * Fast Binary GCD (Stein's Algorithm) for BigInt.
 */
function gcd(a: bigint, b: bigint): bigint {
  if (a === b) return a;
  if (a === 1n || b === 1n) return 1n;
  if (a === 0n) return b;
  if (b === 0n) return a;

  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;

  let shift = 0n;
  while (((a | b) & 1n) === 0n) {
    a >>= 1n;
    b >>= 1n;
    shift++;
  }
  while ((a & 1n) === 0n) a >>= 1n;
  do {
    while ((b & 1n) === 0n) b >>= 1n;
    if (a > b) [a, b] = [b, a];
    b = b - a;
  } while (b !== 0n);
  return a << shift;
}

/**
 * Reduces a fraction to its simplest form.
 */
function simplify(n: bigint, d: bigint): HighPrecision {
  if (d === 0n) throw new Error("Division by zero");
  if (n === 0n) return { n: 0n, d: 1n };
  const common = gcd(n, d);
  const sign = d < 0n ? -1n : 1n;
  return { n: (n / common) * sign, d: (d / common) * sign };
}

function isUnaryOperation(op: StackOp) {
  return op === "UNARY_PLUS" || op === "UNARY_MINUS";
}

/**
 * Maximum allowed precision
 */
const MAX_PRECISION = 50_000;
/**
 * Threshold to prevent denominators from growing infinitely.
 */
const SIMPLIFY_THRESHOLD = 10n ** 4000n;

export function evaluate(tokens: ParsedToken[]): HighPrecision {
  if (tokens.length === 0) {
    throw new EmptyExpressionError();
  }

  const values: HighPrecision[] = [];
  const ops: StackOp[] = [];

  const applyOp = (pos?: number) => {
    const op = ops.pop();
    if (!op || op === "LPAREN") return;

    const right = values.pop();
    if (right === undefined) throw new UnexpectedEndOfExpressionError();

    if (isUnaryOperation(op)) {
      values.push({ n: op === "UNARY_MINUS" ? -right.n : right.n, d: right.d });
      return;
    }

    const left = values.pop();
    if (left === undefined) throw new InsufficientOperandsError(pos);

    switch (op) {
      case "ADD":
      case "SUBTRACT": {
        const isSub = op === "SUBTRACT";
        let resN: bigint;
        let resD: bigint;

        if (left.d === right.d) {
          resN = isSub ? left.n - right.n : left.n + right.n;
          resD = left.d;
        } else {
          const commonFactor = gcd(left.d, right.d);

          if (commonFactor === 1n) {
            resN = isSub
              ? left.n * right.d - right.n * left.d
              : left.n * right.d + right.n * left.d;
            resD = left.d * right.d;
          } else {
            const multiplierLeft = right.d / commonFactor;
            const multiplierRight = left.d / commonFactor;

            resN = isSub
              ? left.n * multiplierLeft - right.n * multiplierRight
              : left.n * multiplierLeft + right.n * multiplierRight;
            resD = left.d * multiplierLeft;
          }
        }

        if (resD === 1n) {
          values.push({ n: resN, d: 1n });
        } else if (resD > SIMPLIFY_THRESHOLD) {
          values.push(simplify(resN, resD));
        } else {
          values.push({ n: resN, d: resD });
        }
        break;
      }
      case "MULTIPLY": {
        if (left.d === 1n && right.d === 1n) {
          values.push({ n: left.n * right.n, d: 1n });
        } else {
          const g1 = gcd(left.n, right.d);
          const g2 = gcd(right.n, left.d);
          values.push({
            n: (left.n / g1) * (right.n / g2),
            d: (left.d / g2) * (right.d / g1),
          });
        }
        break;
      }
      case "DIVIDE": {
        const g1 = gcd(left.n, right.n);
        const g2 = gcd(right.d, left.d);
        values.push({
          n: (left.n / g1) * (right.d / g2),
          d: (left.d / g2) * (right.n / g1),
        });
        break;
      }
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
    const token = tokens[i]!;
    const prevToken = tokens[i - 1];

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
        const n = BigInt(token.whole + frac);
        const fl = frac.length;
        if (fl > MAX_PRECISION) {
          throw new MaximumPrecisionError(fl, MAX_PRECISION);
        }
        // If it's an integer, don't bother with simplify()
        if (fl === 0) {
          values.push({ n, d: 1n });
        } else {
          // We simplify numbers on input to keep the starting denominators small
          const d = 10n ** BigInt(fl);
          values.push(simplify(n, d));
        }
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
      case "DIV": {
        pushOpWithPrecedence("DIVIDE", token.pos);
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

  const result = values[0];
  if (!result) throw new UnexpectedEndOfExpressionError();

  return simplify(result.n, result.d);
}
