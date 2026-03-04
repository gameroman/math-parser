import { simplify } from "./simplify";
import type { Value } from "./types";

/**
 * Returns the largest integer less than or equal to a Value.
 */
export function floor(v: Value): bigint {
  const { n, d } = simplify(v);
  if (d === 1n) return n;

  const isNegative = n < 0n;
  const result = n / d;
  const hasRemainder = n % d !== 0n;

  return isNegative && hasRemainder ? result - 1n : result;
}
