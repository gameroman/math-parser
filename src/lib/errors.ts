export class InterpreterError extends Error {
  constructor(
    message: string,
    public pos?: number,
  ) {
    super(pos !== undefined ? `${message} at position ${pos}` : message);
    this.name = this.constructor.name;
  }
}

export class UnexpectedEndOfExpressionError extends InterpreterError {
  constructor() {
    super("Unexpected end of expression");
  }
}

export class MismatchedParenthesisError extends InterpreterError {
  constructor(pos: number, message = "Mismatched parenthesis") {
    super(message, pos);
  }
}

export class MathSyntaxError extends InterpreterError {
  constructor(message: string, pos: number) {
    super(`Syntax Error: ${message}`, pos);
  }
}

export class InsufficientOperandsError extends InterpreterError {
  constructor(pos?: number) {
    super("Insufficient operands for operation", pos);
  }
}
