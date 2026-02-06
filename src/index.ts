import { evaluate, type HighPrecision } from "./lib/interpreter";
import { parse } from "./lib/lexer";
import { applyUnaryTransformation } from "./lib/transformer";

/**
 * Converts BigInt + Scale to String without using Regex.
 */
export function formatResult(hp: HighPrecision): string {
  let isNegative = hp.value < 0n;
  let absoluteValue = isNegative ? -hp.value : hp.value;
  let s = absoluteValue.toString();

  if (hp.scale <= 0) {
    // Integer result (or scale shifted left)
    const result = s + "0".repeat(Math.abs(hp.scale));
    return isNegative && result !== "0" ? "-" + result : result;
  }

  // Pad leading zeros if necessary (e.g., .001)
  if (s.length <= hp.scale) {
    s = s.padStart(hp.scale + 1, "0");
  }

  const dotPos = s.length - hp.scale;
  let integerPart = s.slice(0, dotPos);
  let fractionalPart = s.slice(dotPos);

  // Manual trimming of trailing zeros from the fractional part
  let lastNonZero = -1;
  for (let i = fractionalPart.length - 1; i >= 0; i--) {
    if (fractionalPart[i] !== "0") {
      lastNonZero = i;
      break;
    }
  }

  const trimmedFraction =
    lastNonZero === -1 ? "" : fractionalPart.slice(0, lastNonZero + 1);
  const result =
    trimmedFraction === "" ? integerPart : integerPart + "." + trimmedFraction;

  return isNegative && result !== "0" ? "-" + result : result;
}

/**
 * The main entry point for the library.
 * It pipes the expression through the full compilation pipeline.
 */
export function calculate(expression: string): string {
  const tokens = parse(expression);
  const transformed = applyUnaryTransformation(tokens);
  const result = evaluate(transformed);
  return formatResult(result);
}
