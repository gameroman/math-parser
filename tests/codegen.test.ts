import { describe, it, expect } from "bun:test";

import { serialize } from "../src/lib/codegen";
import { parse } from "../src/lib/lexer";

describe("serialize", () => {
  it("serializes a simple number", () => {
    expect(serialize(parse("1"))).toEqual("1");
  });

  it("serializes a simple expression", () => {
    expect(serialize(parse("1 + 1"))).toEqual("1 + 1");
    expect(serialize(parse("1 - 1"))).toEqual("1 - 1");
    expect(serialize(parse("1 * 1"))).toEqual("1 * 1");
    expect(serialize(parse("1 / 1"))).toEqual("1 / 1");
  });

  it("should correctly format unary operators", () => {
    expect(serialize(parse("+1"))).toEqual("+1");
    expect(serialize(parse("-1"))).toEqual("-1");
  });

  it("should serialize parentheses correctly", () => {
    expect(serialize(parse("(1 + 1) * 2"))).toEqual("(1 + 1) * 2");
    expect(serialize(parse("-(1 + 1)"))).toEqual("-(1 + 1)");
  });

  it("should handle double unary operators without spaces", () => {
    expect(serialize(parse("--1"))).toEqual("--1");
    expect(serialize(parse("+-1"))).toEqual("+-1");
  });

  it("should handle unary operators inside binary expressions", () => {
    expect(serialize(parse("5 + -1"))).toEqual("5 + -1");
    expect(serialize(parse("2 * -3"))).toEqual("2 * -3");
  });

  it("should handle implicit multiplication correctly", () => {
    expect(serialize(parse("2(3)"))).toEqual("2(3)");
    expect(serialize(parse("(2)(3)"))).toEqual("(2)(3)");
  });
});
