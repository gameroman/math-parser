import { describe, it, expect } from "bun:test";

import { calculate } from "../src";
import {
  EmptyExpressionError,
  IncompleteExpressionError,
  MathSyntaxError,
  MaximumPrecisionError,
  MismatchedParenthesisError,
  UnexpectedEndOfExpressionError,
} from "../src/lib/errors";

describe("evaluate", () => {
  it("should handle a number", () => {
    expect(calculate("1")).toBe("1");
  });

  it("should handle a simple addition", () => {
    expect(calculate("1 + 1")).toBe("2");
  });

  describe("adding a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 + ".repeat(numbers) + "0";
      it(`should handle adding ${numbers} numbers`, () => {
        expect(calculate(expression)).toBe(`${numbers}`);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  it("should handle a simple positive number", () => {
    expect(calculate("+1")).toBe("1");
  });

  it("should handle a simple negative number", () => {
    expect(calculate("-1")).toBe("-1");
  });

  it("should handle double unary operator", () => {
    expect(calculate("--1")).toBe("1");
    expect(calculate("-+1")).toBe("-1");
    expect(calculate("+-1")).toBe("-1");
    expect(calculate("++1")).toBe("1");
  });

  it("should handle a simple subtraction", () => {
    expect(calculate("1 - 1")).toBe("0");
  });

  it("should handle addition and subtraction", () => {
    expect(calculate("2 + 2 - 1")).toBe("3");
    expect(calculate("2 - 1 + 2")).toBe("3");
    expect(calculate("5 - 1 - 2")).toBe("2");
  });

  it("should handle a simple multiplication", () => {
    expect(calculate("3 * 4")).toBe("12");
  });

  it("should respect operator precedence (PEMDAS/BODMAS)", () => {
    expect(calculate("1 + 2 * 3")).toBe("7");
    expect(calculate("2 * 3 + 1")).toBe("7");
    expect(calculate("10 - 2 * 4")).toBe("2");
    expect(calculate("10 * 2 - 4")).toBe("16");
  });

  it("should handle unary operators with multiplication", () => {
    expect(calculate("-2 * 3")).toBe("-6");
    expect(calculate("2 * -3")).toBe("-6");
    expect(calculate("-2 * -3")).toBe("6");
  });

  describe("multiplying a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 * ".repeat(numbers) + "1";
      it(`should handle multiplying ${numbers} numbers`, () => {
        expect(calculate(expression)).toBe("1");
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  describe("adding and multiplying a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 * 1 + ".repeat(numbers) + "0";
      it(`should handle adding and multiplying ${numbers} numbers`, () => {
        expect(calculate(expression)).toBe(`${numbers}`);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  it("should handle parentheses", () => {
    expect(calculate("(1 + 2) * 3")).toBe("9");
    expect(calculate("2 * (3 + 4)")).toBe("14");
  });

  it("should handle nested parentheses", () => {
    expect(calculate("((1 + 1) * 2) + 1")).toBe("5");
  });

  it("should handle unary operators with parentheses", () => {
    expect(calculate("-(1 + 1)")).toBe("-2");
  });

  describe("a lot of parentheses", () => {
    const getTest = (n: number) => {
      const expression = "(".repeat(n) + "0" + ")".repeat(n);
      it(`should handle ${n} parentheses`, () => {
        expect(() => calculate(expression)).not.toThrow();
        expect(calculate(expression)).toBe("0");
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  it("should handle implicit multiplication", () => {
    expect(calculate("2(2)")).toBe("4");
    expect(calculate("2(3+4)")).toBe("14");
    expect(calculate("(1+2)(3+4)")).toBe("21");
  });

  it("should correctly handle order of implicit multiplication", () => {
    expect(calculate("2 + 2(1 + 1)")).toBe("6");
    expect(calculate("2 * 2(1 + 2)")).toBe("12");
    expect(calculate("8 - 2(1 + 2)")).toBe("2");
  });

  it("should correctly handle a decimal", () => {
    expect(calculate("0.1")).toBe("0.1");
    expect(calculate("0.01")).toBe("0.01");
  });

  it("should correctly add 2 decimals", () => {
    expect(calculate("0.1 + 0.1")).toBe("0.2");
    expect(calculate("0.1 + 0.2")).toBe("0.3");
    expect(calculate("0.1 + 0.01")).toBe("0.11");
  });

  it("should correctly add a whole number with a decimal", () => {
    expect(calculate("1 + 0.2")).toBe("1.2");
    expect(calculate("0.3 + 2")).toBe("2.3");
  });

  it("should correctly multiply 2 decimals", () => {
    expect(calculate("0.5 * 0.5")).toBe("0.25");
    expect(calculate("0.1 * 0.2")).toBe("0.02");
  });

  it("should correctly multiply a whole number with a decimal", () => {
    expect(calculate("2 * 0.5")).toBe("1");
    expect(calculate("0.3 * 7")).toBe("2.1");
  });

  it("should not throw MaximumPrecisionError for big scale", () => {
    const bigDecimal = "0." + "0".repeat(50_000) + "1";
    expect(() => calculate(bigDecimal)).not.toThrow(MaximumPrecisionError);
  });

  it("should not throw MaximumPrecisionError for adding big scales", () => {
    const hugeDecimal1 = "0." + "0".repeat(50_000) + "1";
    const hugeDecimal2 = "0." + "0".repeat(10_000) + "1";
    expect(() => calculate(`${hugeDecimal1} + ${hugeDecimal2}`)).not.toThrow(
      MaximumPrecisionError,
    );
  });
});

describe("evaluate - error handling", () => {
  it("should throw MathSyntaxError for consecutive binary operators", () => {
    // 5 * * 3 is invalid
    expect(() => calculate("5 * * 3")).toThrow(MathSyntaxError);
    expect(() => calculate("5 * * 3")).toThrow(/Unexpected operator '\*'/);
  });

  it("should throw MathSyntaxError for invalid operator after opening parenthesis", () => {
    // (*) is invalid
    expect(() => calculate("(*)")).toThrow(MathSyntaxError);
    expect(() => calculate("( * 2)")).toThrow(/Unexpected operator '\*'/);
  });

  it("should throw MathSyntaxError for empty parentheses", () => {
    expect(() => calculate("()")).toThrow(MathSyntaxError);
  });

  it("should throw MismatchedParenthesisError for extra closing parenthesis", () => {
    expect(() => calculate("1 + 2)")).toThrow(MismatchedParenthesisError);
  });

  it("should throw MismatchedParenthesisError for missing closing parenthesis", () => {
    expect(() => calculate("(1 + 2")).toThrow(MismatchedParenthesisError);
    expect(() => calculate("(1 + 2")).toThrow(/Missing closing '\)'/);
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

  it("should throw EmptyExpressionError for empty expression", () => {
    expect(() => calculate("")).toThrow(EmptyExpressionError);
  });

  it("should throw UnexpectedEndOfExpressionError for operation-only expression", () => {
    expect(() => calculate("-")).toThrow(UnexpectedEndOfExpressionError);
  });

  it("should throw MaximumPrecisionError for very large scale", () => {
    const hugeDecimal = "0." + "0".repeat(500_000) + "1";
    expect(() => calculate(hugeDecimal)).toThrow(MaximumPrecisionError);
  });
});
