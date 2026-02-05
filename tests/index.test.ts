import { describe, it, expect } from "bun:test";

import { lexer, serialize, evaluate } from "../src/lib/index";

describe("evaluate", () => {
  it("should handle a number", () => {
    expect(evaluate(lexer("1"))).toEqual(1);
  });

  it("should handle a simple addition", () => {
    expect(evaluate(lexer("1 + 1"))).toEqual(2);
  });

  describe("adding a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 + ".repeat(numbers) + "0";
      it(`should handle adding ${numbers} numbers`, () => {
        expect(evaluate(lexer(expression))).toEqual(numbers);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  it("should handle a simple positive number", () => {
    expect(evaluate(lexer("+1"))).toEqual(1);
  });

  it("should handle a simple negative number", () => {
    expect(evaluate(lexer("-1"))).toEqual(-1);
  });

  it("should handle a simple subtraction", () => {
    expect(evaluate(lexer("1 - 1"))).toEqual(0);
  });

  it("should handle addition and subtraction", () => {
    expect(evaluate(lexer("2 + 2 - 1"))).toEqual(3);
    expect(evaluate(lexer("2 - 1 + 2"))).toEqual(3);
    expect(evaluate(lexer("5 - 1 - 2"))).toEqual(2);
  });

  it("should handle a simple multiplication", () => {
    expect(evaluate(lexer("3 * 4"))).toEqual(12);
  });

  it("should respect operator precedence (PEMDAS/BODMAS)", () => {
    expect(evaluate(lexer("1 + 2 * 3"))).toEqual(7);
    expect(evaluate(lexer("2 * 3 + 1"))).toEqual(7);
    expect(evaluate(lexer("10 - 2 * 4"))).toEqual(2);
    expect(evaluate(lexer("10 * 2 - 4"))).toEqual(16);
  });

  it("should handle unary operators with multiplication", () => {
    expect(evaluate(lexer("-2 * 3"))).toEqual(-6);
    expect(evaluate(lexer("2 * -3"))).toEqual(-6);
    expect(evaluate(lexer("-2 * -3"))).toEqual(6);
  });

  describe("multiplying a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 * ".repeat(numbers) + "1";
      it(`should handle multiplying ${numbers} numbers`, () => {
        expect(evaluate(lexer(expression))).toEqual(1);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });
});

describe("serialize", () => {
  it("serializes a simple number", () => {
    expect(serialize(lexer("1"))).toEqual("1");
  });

  it("serializes a simple expression", () => {
    expect(serialize(lexer("1 + 1"))).toEqual("1 + 1");
  });
});
