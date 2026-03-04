import type { Value } from "./types";
import { simplify } from "./simplify";
import { InterpreterError } from "../errors";

/**
 * Calculates the integer square root of a BigInt.
 */
function isqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new InterpreterError("Square root of negative not supported yet.");
  }
  if (value < 2n) return value;

  let x = value / 2n + 1n;
  let y = (x + value / x) / 2n;
  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }
  return x;
}

export function sqrt(v: Value, precisionDigits: number = 100): Value {
  if (v.n < 0n) {
    throw new InterpreterError("Square root of negative not supported yet.");
  }

  if (v.n === 0n) return { n: 0n, d: 1n };

  // To get 'p' digits of precision in a fraction, we multiply the
  // numerator by 10^(2*p) before taking the integer sqrt.
  const scaleFactor = 10n ** BigInt(precisionDigits * 2);
  const scaledNumerator = (v.n * scaleFactor) / v.d;

  const rootN = isqrt(scaledNumerator);
  const rootD = 10n ** BigInt(precisionDigits);

  return simplify({ n: rootN, d: rootD });
}
