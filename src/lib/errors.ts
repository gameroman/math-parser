export class LexerError extends Error {
  constructor(
    message: string,
    public pos: number,
  ) {
    super(
      pos !== undefined ? `LexerError: ${message} at position ${pos}` : message,
    );
    this.name = this.constructor.name;
  }
}

export class InterpreterError extends Error {
  constructor(
    message: string,
    public pos?: number,
  ) {
    super(
      pos !== undefined
        ? `InterpreterError: ${message} at position ${pos}`
        : `InterpreterError: ${message}`,
    );
    this.name = this.constructor.name;
  }
}

export class MaximumPrecisionError extends InterpreterError {
  constructor(precision: number, maxPrecision: number) {
    super(
      `Exceeded maximum precision of ${maxPrecision} digits (${precision}).`,
    );
  }
}

export class EmptyExpressionError extends InterpreterError {
  constructor() {
    super("Empty expression");
  }
}

export class UnexpectedEndOfExpressionError extends InterpreterError {
  constructor() {
    super("Unexpected end of expression");
  }
}

export class MismatchedParenthesisError extends InterpreterError {
  constructor(pos: number, message: string = "Mismatched parenthesis") {
    super(message, pos);
  }
}

export class InsufficientOperandsError extends InterpreterError {
  constructor(pos?: number) {
    super("Insufficient operands for operation", pos);
  }
}

export class ParserError extends Error {
  constructor(
    message: string,
    public pos: number,
  ) {
    super(
      pos !== undefined
        ? `ParserError: ${message} at position ${pos}`
        : `ParserError: ${message}`,
    );
    this.name = this.constructor.name;
  }
}

export class MathSyntaxError extends ParserError {
  constructor(message: string, pos: number) {
    super(`Syntax Error: ${message}`, pos);
  }
}

export class IncompleteExpressionError extends MathSyntaxError {
  constructor(message: string, pos: number) {
    super(`Incomplete expression: ${message}`, pos);
  }
}
