class GenericMathErrror extends Error {
  pos?: number;
  constructor(name: string, message: string, pos?: number) {
    if (pos === undefined) {
      super(`${name}: ${message}`);
    } else {
      super(`${name}: ${message} at position ${pos}`);
    }
    this.pos = pos;
    this.name = name;
  }
}

export class LexerError extends GenericMathErrror {
  constructor(message: string, pos: number) {
    super(`LexerError`, message, pos);
  }
}

export class InterpreterError extends GenericMathErrror {
  constructor(message: string, pos?: number) {
    super(`InterpreterError`, message, pos);
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

export class ParserError extends GenericMathErrror {
  constructor(message: string, pos: number) {
    super(`ParserError`, message, pos);
  }
}

export class IncompleteExpressionError extends ParserError {
  constructor(message: string, pos: number) {
    super(`Incomplete expression: ${message}`, pos);
  }
}
