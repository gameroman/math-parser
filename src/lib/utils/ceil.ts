import { simplify } from "./simplify";
import type { Value } from "./types";

/**
 * Returns the smallest integer greater than or equal to a Value.
 */
export function ceil(v: Value): bigint {
  const { n, d } = simplify(v);
  if (d === 1n) return n;

  const isPositive = n > 0n;
  const result = n / d;
  const hasRemainder = n % d !== 0n;

  return isPositive && hasRemainder ? result + 1n : result;
}
