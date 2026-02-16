import { describe, it, expect } from "bun:test";

import { calculate } from "../src";
import { IncompleteExpressionError, ParserError } from "../src/lib/errors";

describe("parse", () => {
  it("should throw ParserError for consecutive binary operators", () => {
    expect(() => calculate("5 * * 3")).toThrow(ParserError);
    expect(() => calculate("5 * * 3")).toThrow(/Unexpected operator '\*'/);
  });

  it("should throw ParserError for invalid operator after opening parenthesis", () => {
    expect(() => calculate("(*)")).toThrow(ParserError);
    expect(() => calculate("( * 2)")).toThrow(/Unexpected operator '\*'/);
  });

  it("should throw ParserError for empty parentheses", () => {
    expect(() => calculate("()")).toThrow(ParserError);
  });

  it("should throw IncompleteExpressionError for trailing operators", () => {
    expect(() => calculate("5 +")).toThrow(ParserError);
    expect(() => calculate("5 +")).toThrow(IncompleteExpressionError);
    expect(() => calculate("5 +")).toThrow(/trailing operator '\+'/);
  });

  it("should throw IncompleteExpressionError for operation-only expression", () => {
    expect(() => calculate("-")).toThrow(IncompleteExpressionError);
  });

  it("should throw ParserError for leading multiplication", () => {
    expect(() => calculate("* 5")).toThrow(ParserError);
  });

  it("should throw ParserError for invalid unary combinations", () => {
    expect(() => calculate("5 + * 3")).toThrow(ParserError);
  });

  it("should throw ParserError for two space separated numbers", () => {
    expect(() => calculate("1 2")).toThrow(ParserError);
  });
});
