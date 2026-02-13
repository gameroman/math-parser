import { describe, it, expect } from "bun:test";

import { LexerError } from "../src/lib/errors";
import { tokenize } from "../src/lib/lexer";

describe("tokenize", () => {
  it("shoud throw LexerError for invalid input", () => {
    expect(() => tokenize("?")).toThrow(LexerError);
  });

  it("shoud not throw LexerError for valid decimal number", () => {
    expect(() => tokenize("1.2")).not.toThrow(LexerError);
    expect(() => tokenize("1.")).not.toThrow(LexerError);
    expect(() => tokenize(".2")).not.toThrow(LexerError);
  });

  it("shoud throw LexerError for invalid decimal number", () => {
    expect(() => tokenize("1..2")).toThrow(LexerError);
    expect(() => tokenize("1.2.")).toThrow(LexerError);
    expect(() => tokenize(".1.2")).toThrow(LexerError);
    expect(() => tokenize("1.1.1")).toThrow(LexerError);
    expect(() => tokenize("1.1.1.1")).toThrow(LexerError);
    expect(() => tokenize("1 + 1.1.1")).toThrow(LexerError);
  });

  it("shoud throw LexerError for invalid scientific notation", () => {
    expect(() => tokenize("1e2e")).toThrow(LexerError);
    expect(() => tokenize("1e2.3")).toThrow(LexerError);
    expect(() => tokenize("1e2e3")).toThrow(LexerError);
    expect(() => tokenize("e1")).toThrow(LexerError);
  });

  it("shoud not throw LexerError for valid scientific notation", () => {
    expect(() => tokenize("1e3")).not.toThrow(LexerError);
    expect(() => tokenize("1.2e3")).not.toThrow(LexerError);
    expect(() => tokenize("1e-3")).not.toThrow(LexerError);
    expect(() => tokenize("1.2e-3")).not.toThrow(LexerError);
    expect(() => tokenize("-1e2")).not.toThrow(LexerError);
  });
});
