import { describe, it, expect } from "bun:test";

import { serialize } from "../src/lib/codegen";
import { parse } from "../src/lib/parser";

describe("serialize", () => {
  it("serializes a simple number", () => {
    expect(serialize(parse("1"))).toEqual("1");
  });

  it("serializes a simple expression", () => {
    expect(serialize(parse("1 + 1"))).toEqual("1 + 1");
    expect(serialize(parse("1 - 1"))).toEqual("1 - 1");
    expect(serialize(parse("1 * 1"))).toEqual("1 * 1");
  });

  it("should correctly format unary operators", () => {
    expect(serialize(parse("+1"))).toEqual("+1");
    expect(serialize(parse("-1"))).toEqual("-1");
  });
});
