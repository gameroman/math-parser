import { describe, it, expect } from "bun:test";

import { MathSyntaxError, MismatchedParenthesisError } from "../src/lib/errors";
import { calculate } from "../src";

describe("evaluate", () => {
  it("should handle a number", () => {
    expect(calculate("1")).toEqual(1);
  });

  it("should handle a simple addition", () => {
    expect(calculate("1 + 1")).toEqual(2);
  });

  describe("adding a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 + ".repeat(numbers) + "0";
      it(`should handle adding ${numbers} numbers`, () => {
        expect(calculate(expression)).toEqual(numbers);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  it("should handle a simple positive number", () => {
    expect(calculate("+1")).toEqual(1);
  });

  it("should handle a simple negative number", () => {
    expect(calculate("-1")).toEqual(-1);
  });

  it("should handle double unary operator", () => {
    expect(calculate("--1")).toEqual(1);
    expect(calculate("-+1")).toEqual(-1);
    expect(calculate("+-1")).toEqual(-1);
    expect(calculate("++1")).toEqual(1);
  });

  it("should handle a simple subtraction", () => {
    expect(calculate("1 - 1")).toEqual(0);
  });

  it("should handle addition and subtraction", () => {
    expect(calculate("2 + 2 - 1")).toEqual(3);
    expect(calculate("2 - 1 + 2")).toEqual(3);
    expect(calculate("5 - 1 - 2")).toEqual(2);
  });

  it("should handle a simple multiplication", () => {
    expect(calculate("3 * 4")).toEqual(12);
  });

  it("should respect operator precedence (PEMDAS/BODMAS)", () => {
    expect(calculate("1 + 2 * 3")).toEqual(7);
    expect(calculate("2 * 3 + 1")).toEqual(7);
    expect(calculate("10 - 2 * 4")).toEqual(2);
    expect(calculate("10 * 2 - 4")).toEqual(16);
  });

  it("should handle unary operators with multiplication", () => {
    expect(calculate("-2 * 3")).toEqual(-6);
    expect(calculate("2 * -3")).toEqual(-6);
    expect(calculate("-2 * -3")).toEqual(6);
  });

  describe("multiplying a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 * ".repeat(numbers) + "1";
      it(`should handle multiplying ${numbers} numbers`, () => {
        expect(calculate(expression)).toEqual(1);
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
        expect(calculate(expression)).toEqual(numbers);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  it("should handle parentheses", () => {
    expect(calculate("(1 + 2) * 3")).toEqual(9);
    expect(calculate("2 * (3 + 4)")).toEqual(14);
  });

  it("should handle nested parentheses", () => {
    expect(calculate("((1 + 1) * 2) + 1")).toEqual(5);
  });

  it("should handle unary operators with parentheses", () => {
    expect(calculate("-(1 + 1)")).toEqual(-2);
  });

  describe("a lot of parentheses", () => {
    const getTest = (n: number) => {
      const expression = "(".repeat(n) + "0" + ")".repeat(n);
      it(`should handle ${n} parentheses`, () => {
        expect(() => calculate(expression)).not.toThrow(RangeError);
        expect(() => calculate(expression)).not.toThrow(Error);
        expect(calculate(expression)).toEqual(0);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  it("should handle implicit multiplication", () => {
    expect(calculate("2(2)")).toEqual(4);
    expect(calculate("2(3+4)")).toEqual(14);
    expect(calculate("(1+2)(3+4)")).toEqual(21);
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

  it("should throw MathSyntaxError for trailing operators", () => {
    expect(() => calculate("5 +")).toThrow(MathSyntaxError);
    expect(() => calculate("5 +")).toThrow(/trailing operator '\+'/);
  });

  it("should throw MathSyntaxError for leading multiplication", () => {
    expect(() => calculate("* 5")).toThrow(MathSyntaxError);
  });

  it("should throw MathSyntaxError for invalid unary combinations", () => {
    expect(() => calculate("5 + * 3")).toThrow(MathSyntaxError);
  });
});
