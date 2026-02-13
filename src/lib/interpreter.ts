import type { ParsedToken } from "./parser";

import {
  UnexpectedEndOfExpressionError,
  MismatchedParenthesisError,
  InsufficientOperandsError,
  InterpreterError,
  EmptyExpressionError,
  MaximumPrecisionError,
} from "./errors";

const precedence = {
  ADD: 1,
  SUBTRACT: 1,
  MULTIPLY: 2,
  DIVIDE: 2,
  POWER: 4,
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

  const stackN: bigint[] = [];
  const stackD: bigint[] = [];
  const ops: StackOp[] = [];

  const applyOp = (pos?: number) => {
    const op = ops.pop();
    if (!op || op === "LPAREN") return;

    const rN = stackN.pop();
    const rD = stackD.pop();
    if (rN === undefined || rD === undefined)
      throw new UnexpectedEndOfExpressionError();

    if (isUnaryOperation(op)) {
      stackN.push(op === "UNARY_MINUS" ? -rN : rN);
      stackD.push(rD);
      return;
    }

    const lN = stackN.pop();
    const lD = stackD.pop();
    if (lN === undefined || lD === undefined)
      throw new InsufficientOperandsError(pos);

    let resN: bigint;
    let resD: bigint;

    switch (op) {
      case "ADD":
      case "SUBTRACT": {
        const isSub = op === "SUBTRACT";
        if (lD === rD) {
          resN = isSub ? lN - rN : lN + rN;
          resD = lD;
        } else {
          // LCM approach to keep numbers smaller
          const common = gcd(lD, rD);
          if (common === 1n) {
            resN = isSub ? lN * rD - rN * lD : lN * rD + rN * lD;
            resD = lD * rD;
          } else {
            const mLeft = rD / common;
            const mRight = lD / common;
            resN = isSub ? lN * mLeft - rN * mRight : lN * mLeft + rN * mRight;
            resD = lD * mLeft;
          }
        }
        break;
      }
      case "MULTIPLY": {
        if (lD === 1n && rD === 1n) {
          resN = lN * rN;
          resD = 1n;
        } else {
          const g1 = gcd(lN, rD);
          const g2 = gcd(rN, lD);
          resN = (lN / g1) * (rN / g2);
          resD = (lD / g2) * (rD / g1);
        }
        break;
      }
      case "DIVIDE": {
        const g1 = gcd(lN, rN);
        const g2 = gcd(rD, lD);
        resN = (lN / g1) * (rD / g2);
        resD = (lD / g2) * (rN / g1);
        break;
      }
      case "POWER": {
        if (rD !== 1n) {
          throw new InterpreterError(
            "Fractional exponents are not supported yet",
          );
        }

        // Handling negative exponents: flip the fraction and make exponent positive
        let exponent = rN;
        let baseN = lN;
        let baseD = lD;

        if (exponent < 0n) {
          [baseN, baseD] = [baseD, baseN];
          exponent = -exponent;
        }

        resN = baseN ** exponent;
        resD = baseD ** exponent;
        break;
      }
    }

    if (resD > SIMPLIFY_THRESHOLD) {
      const reduced = simplify(resN, resD);
      stackN.push(reduced.n);
      stackD.push(reduced.d);
    } else {
      stackN.push(resN);
      stackD.push(resD);
    }
  };

  const pushOpWithPrecedence = (currentOp: StackOp, pos: number) => {
    const isUnary = isUnaryOperation(currentOp);
    const isRightAssociative = currentOp === "POWER";

    while (
      ops.length > 0 &&
      !isUnary &&
      (isRightAssociative
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
        if (fl === 0) {
          stackN.push(n);
          stackD.push(1n);
        } else {
          const d = 10n ** BigInt(fl);
          const reduced = simplify(n, d);
          stackN.push(reduced.n);
          stackD.push(reduced.d);
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
      case "POW": {
        pushOpWithPrecedence("POWER", token.pos);
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
      // Automatically close missing parentheses instead of throwing an error
      ops.pop();
      continue;
    }
    applyOp(lastPos);
  }

  const finalN = stackN.pop();
  const finalD = stackD.pop();
  if (finalN === undefined || finalD === undefined) {
    throw new UnexpectedEndOfExpressionError();
  }

  return simplify(finalN, finalD);
}
