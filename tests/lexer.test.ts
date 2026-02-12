import { describe, it, expect } from "bun:test";

import { LexerError } from "../src/lib/errors";
import { tokenize } from "../src/lib/lexer";

describe("tokenize", () => {
  it("shoud throw LexerError for invalid input", () => {
    expect(() => tokenize("?")).toThrow(LexerError);
  });

  it("shoud throw LexerError for invalid decimal number", () => {
    expect(() => tokenize("1..2")).toThrow(LexerError);
    expect(() => tokenize("1.2.")).toThrow(LexerError);
    expect(() => tokenize(".1.2")).toThrow(LexerError);
    expect(() => tokenize("1.1.1")).toThrow(LexerError);
    expect(() => tokenize("1.1.1.1")).toThrow(LexerError);
    expect(() => tokenize("1 + 1.1.1")).toThrow(LexerError);
  });
});
