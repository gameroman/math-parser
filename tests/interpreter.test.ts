import { describe, it, expect } from "bun:test";

import { evaluate } from "../src/lib/interpreter";
import { parse } from "../src/lib/parser";

describe("evaluate", () => {
  it("should handle a number", () => {
    expect(evaluate(parse("1"))).toEqual(1);
  });

  it("should handle a simple addition", () => {
    expect(evaluate(parse("1 + 1"))).toEqual(2);
  });

  describe("adding a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 + ".repeat(numbers) + "0";
      it(`should handle adding ${numbers} numbers`, () => {
        expect(evaluate(parse(expression))).toEqual(numbers);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });

  it("should handle a simple positive number", () => {
    expect(evaluate(parse("+1"))).toEqual(1);
  });

  it("should handle a simple negative number", () => {
    expect(evaluate(parse("-1"))).toEqual(-1);
  });

  it("should handle a simple subtraction", () => {
    expect(evaluate(parse("1 - 1"))).toEqual(0);
  });

  it("should handle addition and subtraction", () => {
    expect(evaluate(parse("2 + 2 - 1"))).toEqual(3);
    expect(evaluate(parse("2 - 1 + 2"))).toEqual(3);
    expect(evaluate(parse("5 - 1 - 2"))).toEqual(2);
  });

  it("should handle a simple multiplication", () => {
    expect(evaluate(parse("3 * 4"))).toEqual(12);
  });

  it("should respect operator precedence (PEMDAS/BODMAS)", () => {
    expect(evaluate(parse("1 + 2 * 3"))).toEqual(7);
    expect(evaluate(parse("2 * 3 + 1"))).toEqual(7);
    expect(evaluate(parse("10 - 2 * 4"))).toEqual(2);
    expect(evaluate(parse("10 * 2 - 4"))).toEqual(16);
  });

  it("should handle unary operators with multiplication", () => {
    expect(evaluate(parse("-2 * 3"))).toEqual(-6);
    expect(evaluate(parse("2 * -3"))).toEqual(-6);
    expect(evaluate(parse("-2 * -3"))).toEqual(6);
  });

  describe("multiplying a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 * ".repeat(numbers) + "1";
      it(`should handle multiplying ${numbers} numbers`, () => {
        expect(evaluate(parse(expression))).toEqual(1);
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
        expect(evaluate(parse(expression))).toEqual(numbers);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10_000);
    getTest(100_000);
    getTest(1000_000);
  });
});
