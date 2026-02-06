import { evaluate, type HighPrecision } from "./lib/interpreter";
import { parse } from "./lib/lexer";
import { applyUnaryTransformation } from "./lib/transformer";

// Use a Discriminated Union for type-safe options
export type FormatOptions =
  | {
      format?: "decimal";
      /** Maximum decimal places. Defaults to 20. */
      maxDecimals?: number;
    }
  | { format: "precise" };

/**
 * Converts Rational Fraction (n/d) to a Decimal or Fraction String.
 */
export function formatResult(
  hp: HighPrecision,
  options: FormatOptions = {},
): string {
  const { n, d } = hp;

  if (d === 0n) return "NaN";

  // --- Fraction Format Logic ---
  if (options.format === "precise") {
    if (d === 1n) return n.toString();
    return `${n}/${d}`;
  }

  // --- Decimal Format Logic ---
  const maxDecimals =
    options.format === "decimal" ? (options.maxDecimals ?? 20) : 20;

  const isNegative = n < 0n;
  const absN = n < 0n ? -n : n;

  const integerPart = (absN / d).toString();
  let remainder = absN % d;

  if (remainder === 0n) {
    const res = (isNegative ? "-" : "") + integerPart;
    return res === "-0" ? "0" : res;
  }

  let fractionalPart = "";
  let count = 0;

  // Long division simulation
  while (remainder !== 0n && count < maxDecimals) {
    remainder *= 10n;
    fractionalPart += (remainder / d).toString();
    remainder %= d;
    count++;
  }

  // Trim trailing zeros
  let lastNonZero = -1;
  for (let i = fractionalPart.length - 1; i >= 0; i--) {
    if (fractionalPart[i] !== "0") {
      lastNonZero = i;
      break;
    }
  }

  const finalFraction =
    lastNonZero === -1 ? "" : fractionalPart.slice(0, lastNonZero + 1);
  const result =
    finalFraction === "" ? integerPart : `${integerPart}.${finalFraction}`;
  const sign = isNegative && result !== "0" ? "-" : "";

  return sign + result;
}

/**
 * The main entry point for the library.
 */
export function calculate(
  expression: string,
  options: FormatOptions = {},
): string {
  const tokens = parse(expression);
  const transformed = applyUnaryTransformation(tokens);
  const result = evaluate(transformed);
  return formatResult(result, options);
}
