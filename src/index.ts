import { parse } from "./lib/lexer";
import { applyUnaryTransformation } from "./lib/transformer";
import { evaluate } from "./lib/interpreter";

/**
 * The main entry point for the library.
 * It pipes the expression through the full compilation pipeline.
 */
export function calculate(expression: string): number {
  const tokens = parse(expression);
  const transformed = applyUnaryTransformation(tokens);
  return evaluate(transformed);
}
