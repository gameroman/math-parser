import { gcd } from "./gcd";
import type { Value } from "./types";

/**
 * Calculates remainder of division.
 */
export function mod(a: Value, b: Value): Value {
  const d = (a.d * b.d) / gcd(a.d, a.d);

  const n1 = a.n * (d / a.d);
  const n2 = b.n * (d / a.d);

  const n = ((n1 % n2) + n2) % n2;

  return { n, d };
}
