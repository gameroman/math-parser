import { evaluate, type Value } from "./lib/interpreter";
import { tokenize, type LexerOptions } from "./lib/lexer";
import { parse } from "./lib/parser";

// Use a Discriminated Union for type-safe options
export type FormatOptions =
  | {
      format?: "decimal";
      /** Maximum decimal places. Defaults to 20. */
      maxDecimals?: number;
    }
  | { format: "precise" };

const getConstantStr = (coeff: string, c?: Value["c"]) => {
  if (!c) return coeff;
  if (coeff === "1") return c;
  if (coeff === "-1") return `-${c}`;
  return `${coeff}${c}`;
};

/**
 * Converts Result to a Decimal or Fraction String.
 */
export function formatResult(v: Value, options: FormatOptions = {}): string {
  const { n, d, c } = v;

  if (d === 0n) return "NaN";

  // --- Fraction Format Logic ---
  if (options.format === "precise") {
    if (d === 1n) return getConstantStr(n.toString(), c);
    return `${getConstantStr(n.toString(), c)}/${d}`;
  }

  // --- Decimal Format Logic ---
  const maxDecimals = options.maxDecimals ?? 30;

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

type CalculateOptions = FormatOptions & LexerOptions;

/**
 * The main entry point for the library.
 */
export function calculate(
  expression: string,
  options?: CalculateOptions,
): string {
  const tokens = tokenize(expression, options);
  const transformed = parse(tokens);
  const result = evaluate(transformed);
  return formatResult(result, options);
}
