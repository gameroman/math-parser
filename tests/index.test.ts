import { lexer, evaluate } from "../src/lib/index";
import { describe, it, expect } from "bun:test";

describe("evaluate", () => {
  it("should handle a number", () => {
    expect(evaluate(lexer("1"))).toEqual(1);
  });

  it("should handle a simple addition", () => {
    expect(evaluate(lexer("1 + 1"))).toEqual(2);
  });

  describe("should handle adding a lot of numbers", () => {
    const getTest = (numbers: number) => {
      const expression = "1 + ".repeat(numbers) + "0";
      it(`should handle adding ${numbers} numbers`, () => {
        expect(evaluate(lexer(expression))).toEqual(numbers);
      });
    };
    getTest(100);
    getTest(1000);
    getTest(10000);
    getTest(100000);
  });

  it("should handle a simple subtraction", () => {
    expect(evaluate(lexer("1 - 1"))).toEqual(0);
  });

  describe("should handle addition and subtraction", () => {
    expect(evaluate(lexer("2 + 2 - 1"))).toEqual(3);
    expect(evaluate(lexer("2 - 1 + 2"))).toEqual(3);
  });
});
