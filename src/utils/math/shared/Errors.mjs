/**
 * Function error: problem with arguments or domain
 * @extends Error
 */
export class DomainError extends Error {
  constructor(message) {
    super(message)
    this.name = "DomainError"
  }
}

/**
 * Evaluation error: nonreal answer
 * @extends Error
 */
export class NonrealError extends Error {
  constructor(message) {
    super(message)
    this.name = "NonrealError"
  }
}

/**
 * Function error: unsupported function
 * @extends Error
 */
 export class FunctionError extends Error {
  constructor(message) {
    super(message)
    this.name = "FunctionError"
  }
}


