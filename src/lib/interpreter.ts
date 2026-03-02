import {
  UnexpectedEndOfExpressionError,
  MismatchedParenthesisError,
  InsufficientOperandsError,
  InterpreterError,
  EmptyExpressionError,
  MaximumPrecisionError,
  OverflowError,
} from "./errors";
import type { ParsedToken } from "./parser";
import { factorial } from "./utils/factorial";
import { gcd } from "./utils/gcd";

const precedence = {
  LPAREN: 0,
  ABS_OPEN: 0,
  ADD: 1,
  SUBTRACT: 1,
  MULTIPLY: 2,
  DIVIDE: 2,
  UNARY_PLUS: 4,
  UNARY_MINUS: 4,
  EXP: 6,
  IMPLICIT_MUL: 8,
  ABS_FN: 9,
  FACTORIAL: 10,
} as const;

import * as constants from "./constants";

const constantsMap = {
  e: constants.E,
  pi: constants.PI,
} as const;

type StackOp = keyof typeof precedence;

export type Value = {
  n: bigint; // Numerator
  d: bigint; // Denominator
  c?: "pi" | "e";
};

/**
 * Reduces a fraction to its simplest form.
 */
function simplify(v: Value): Value {
  if (v.d === 0n) throw new InterpreterError("Division by zero");
  if (v.n === 0n) return { n: 0n, d: 1n, c: v.c };
  const common = gcd(v.n, v.d);
  const sign = v.d < 0n ? -1n : 1n;
  return { n: (v.n / common) * sign, d: (v.d / common) * sign, c: v.c };
}

function isUnaryOperation(op: StackOp) {
  return op === "UNARY_PLUS" || op === "UNARY_MINUS" || op === "ABS_FN";
}

/**
 * Maximum allowed precision
 */
const MAX_PRECISION = 50_000;
/**
 * Threshold to prevent denominators from growing infinitely.
 */
const SIMPLIFY_THRESHOLD = 10n ** 4000n;

interface PrecisionOptions {
  format?: "decimal" | "precise";
}

export function evaluate(
  tokens: ParsedToken[],
  options: PrecisionOptions = {},
): Value {
  if (tokens.length === 0) {
    throw new EmptyExpressionError();
  }

  const { format } = options;

  const values: Value[] = [];
  const ops: StackOp[] = [];

  const applyOp = (pos?: number) => {
    const op = ops.pop();
    if (!op || op === "LPAREN" || op === "ABS_OPEN") return;

    const right = values.pop();
    if (right === undefined) {
      throw new UnexpectedEndOfExpressionError();
    }

    if (isUnaryOperation(op)) {
      const rN = right.n;
      let resN = rN;
      if (op === "UNARY_MINUS") resN = -rN;
      if (op === "ABS_FN") resN = rN < 0n ? -rN : rN; // Absolute value logic
      values.push({ n: resN, d: right.d });
      return;
    }

    if (op === "FACTORIAL") {
      const reduced = simplify(right);
      if (reduced.d !== 1n || reduced.n < 0n) {
        throw new InterpreterError(
          "Factorial is only defined for non-negative integers",
          pos,
        );
      }
      if (reduced.n >= 4e5) {
        throw new OverflowError();
      }
      values.push({ n: factorial(reduced.n)!, d: 1n });
      return;
    }

    const left = values.pop();
    if (left === undefined) {
      throw new InsufficientOperandsError(pos);
    }

    let resN: bigint;
    let resD: bigint;
    let resC: Value["c"];

    const lN = left.n;
    const lD = left.d;
    const lC = left.c;
    const rN = right.n;
    const rD = right.d;
    const rC = right.c;

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
        if (lC === rC) {
          resC = lC;
        }
        break;
      }
      case "MULTIPLY":
      case "IMPLICIT_MUL": {
        if (lD === 1n && rD === 1n) {
          resN = lN * rN;
          resD = 1n;
        } else {
          const g1 = gcd(lN, rD);
          const g2 = gcd(rN, lD);
          resN = (lN / g1) * (rN / g2);
          resD = (lD / g2) * (rD / g1);
        }
        if (lC === undefined && rC !== undefined) {
          resC = rC;
        } else if (lC !== undefined && rC === undefined) {
          resC = lC;
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
      case "EXP": {
        const normalizedExponent = simplify(right);

        if (normalizedExponent.d !== 1n) {
          throw new InterpreterError(
            `Fractional exponents ${normalizedExponent.n}/${normalizedExponent.d} are not supported yet`,
          );
        }

        // Handling negative exponents: flip the fraction and make exponent positive
        let exponent = normalizedExponent.n;
        let baseN = lN;
        let baseD = lD;

        if (exponent < 0n) {
          [baseN, baseD] = [baseD, baseN];
          exponent = -exponent;
        }

        if (exponent === 0n) {
          resN = 1n;
          resD = 1n;
          break;
        }

        if (exponent === 1n) {
          resN = baseN;
          resD = baseD;
          if (normalizedExponent.c === undefined) {
            resC = lC;
          }
          break;
        }

        if (baseN * exponent > 6e6 || baseD * exponent > 6e6) {
          throw new OverflowError();
        }

        resN = baseN ** exponent;
        resD = baseD ** exponent;
        break;
      }
    }

    if (resD > SIMPLIFY_THRESHOLD) {
      values.push(simplify({ n: resN, d: resD, c: resC }));
    } else {
      values.push({ n: resN, d: resD, c: resC });
    }
  };

  const pushOpWithPrecedence = (currentOp: StackOp, pos: number) => {
    const isUnary = isUnaryOperation(currentOp);
    const isRightAssociative = currentOp === "EXP";

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

    switch (token.type) {
      case "NUMBER": {
        const frac = token.fraction || "";
        const fl = frac.length;
        if (fl > MAX_PRECISION) {
          throw new MaximumPrecisionError(fl, MAX_PRECISION);
        }

        let n = BigInt(token.whole + frac);
        let d = fl === 0 ? 1n : 10n ** BigInt(fl);

        if (token.exponent) {
          if (token.exponent.length > MAX_PRECISION) {
            throw new MaximumPrecisionError(
              token.exponent.length,
              MAX_PRECISION,
            );
          }
          const expValue = BigInt(token.exponent);
          if (expValue >= 0n) {
            n *= 10n ** expValue;
          } else {
            d *= 10n ** -expValue;
          }
        }
        if (d === 1n) {
          values.push({ n, d: 1n });
        } else {
          values.push(simplify({ n, d }));
        }
        break;
      }
      case "CONST": {
        if (format === "precise") {
          values.push({ n: 1n, d: 1n, c: token.id });
        } else {
          const c = constantsMap[token.id];
          values.push({
            n: BigInt(c.replace(".", "")),
            d: 10n ** BigInt(c.length - c.indexOf(".") - 1),
          });
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
      case "ABS_OPEN": {
        ops.push("ABS_OPEN");
        break;
      }
      case "ABS_CLOSE": {
        let foundMatch = false;
        while (ops.length > 0) {
          if (ops[ops.length - 1] === "ABS_OPEN") {
            foundMatch = true;
            break;
          }
          applyOp(token.pos);
        }
        if (!foundMatch) {
          throw new InterpreterError(
            "Mismatched absolute value pipe",
            token.pos,
          );
        }

        ops.pop();
        const val = values.pop();
        if (val === undefined) {
          throw new UnexpectedEndOfExpressionError();
        }

        values.push({ n: val.n < 0n ? -val.n : val.n, d: val.d });
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
        pushOpWithPrecedence("EXP", token.pos);
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
      case "IMPLICIT_MUL": {
        pushOpWithPrecedence("IMPLICIT_MUL", token.pos);
        break;
      }
      case "FACTORIAL": {
        pushOpWithPrecedence("FACTORIAL", token.pos);
        break;
      }
      case "FUNC": {
        switch (token.id) {
          case "abs": {
            pushOpWithPrecedence("ABS_FN", token.pos);
            break;
          }
        }
        break;
      }
    }
  }

  while (ops.length > 0) {
    const top = ops[ops.length - 1];
    const lastPos = tokens[tokens.length - 1]?.pos ?? 0;
    if (top === "LPAREN") {
      ops.pop();
      continue;
    }
    applyOp(lastPos);
  }

  const finalValue = values.pop();
  if (finalValue === undefined) {
    throw new UnexpectedEndOfExpressionError();
  }

  return simplify(finalValue);
}
