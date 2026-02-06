import { describe, it, expect } from "bun:test";

import { LexerError } from "../src/lib/errors";
import { parse } from "../src/lib/lexer";

describe("parse", () => {
  it("shoud throw LexerError for invalid input", () => {
    expect(() => parse("?")).toThrow(LexerError);
  });

  it("shoud throw LexerError for invalid decimal number", () => {
    expect(() => parse("1..2")).toThrow(LexerError);
  });
});
