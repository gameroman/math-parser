import { describe, it, expect } from "bun:test";

import { calculate } from "../src";
import { IncompleteExpressionError, MathSyntaxError } from "../src/lib/errors";

describe("parse", () => {
  it("should throw MathSyntaxError for consecutive binary operators", () => {
    expect(() => calculate("5 * * 3")).toThrow(MathSyntaxError);
    expect(() => calculate("5 * * 3")).toThrow(/Unexpected operator '\*'/);
  });

  it("should throw MathSyntaxError for invalid operator after opening parenthesis", () => {
    expect(() => calculate("(*)")).toThrow(MathSyntaxError);
    expect(() => calculate("( * 2)")).toThrow(/Unexpected operator '\*'/);
  });

  it("should throw MathSyntaxError for empty parentheses", () => {
    expect(() => calculate("()")).toThrow(MathSyntaxError);
  });

  it("should throw IncompleteExpressionError for trailing operators", () => {
    expect(() => calculate("5 +")).toThrow(MathSyntaxError);
    expect(() => calculate("5 +")).toThrow(IncompleteExpressionError);
    expect(() => calculate("5 +")).toThrow(/trailing operator '\+'/);
  });

  it("should throw MathSyntaxError for leading multiplication", () => {
    expect(() => calculate("* 5")).toThrow(MathSyntaxError);
  });

  it("should throw MathSyntaxError for invalid unary combinations", () => {
    expect(() => calculate("5 + * 3")).toThrow(MathSyntaxError);
  });

  it("should throw MathSyntaxError for two space separated numbers", () => {
    expect(() => calculate("1 2")).toThrow(MathSyntaxError);
  });
});
