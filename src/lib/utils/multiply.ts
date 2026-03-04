import { gcd } from "./gcd";
import type { Value } from "./types";

export function multiply(a: Value, b: Value): Value {
  if (a.n === 0n || b.n === 0n) {
    return { n: 0n, d: 1n };
  }

  let n;
  let d;
  let c;

  if (a.d === 1n && b.d === 1n) {
    n = a.n * b.n;
    d = 1n;
  } else {
    const g1 = gcd(a.n, b.d);
    const g2 = gcd(b.n, a.d);
    n = (a.n / g1) * (b.n / g2);
    d = (a.d / g2) * (b.d / g1);
  }

  if (a.c === undefined && b.c !== undefined) {
    c = b.c;
  } else if (a.c !== undefined && b.c === undefined) {
    c = a.c;
  }

  return { n, d, c };
}
