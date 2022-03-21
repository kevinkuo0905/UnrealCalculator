import { NonrealError, DomainError } from "../shared/Errors.mjs"
import { e, pi } from "../functions/Real.mjs"
import * as functions from "../functions/Complex.mjs"
import * as symbolics from "../functions/Symbolic.mjs"

const trigFunctions = ["sin", "cos", "tan", "csc", "sec", "cot"]
const argumentsNum = {
  many: ["add", "multiply", "min", "max", "gcd"],
  four: ["int"],
  three: ["diff"],
  two: ["subtract", "divide", "npr", "ncr", "pow"],
}
const functionNamesList = Object.keys({ ...functions, ...symbolics })
const functionArgsLengths = functionNamesList.reduce((acc, func) => {
  acc[func] = 1
  if (argumentsNum.many.includes(func)) acc[func] = 0
  if (argumentsNum.four.includes(func)) acc[func] = 4
  if (argumentsNum.three.includes(func)) acc[func] = 3
  if (argumentsNum.two.includes(func)) acc[func] = 2
  return acc
}, {})

/**
 * The identity function converts a mathematical constant stored as a string into a number when an
 * evaluation is called.
 * @param {[(String | Number), Number] | String} x
 * @returns {[Number, Number] | String}
 */
const identity = (x) => {
  if (Array.isArray(x)) {
    if (x[0] === "pi") return [pi, 0]
    if (x[0] === "e") return [e, 0]
  }
  return x
}

/**
 * A mathematical expression with operations and arguments: each argument may be complex numbers,
 * strings, or other Expression objects, creating an abstract syntax tree.
 * An expression object containing strings are function expressions of that string variable.
 * An expression object containing only complex numbers as arguments for the leaves of the tree is
 * evaluable and are considered constants.
 */
export default class Expression {
  /**
   * @param {Function} operation
   *  mathematical function or operation, null operation is replaced with the identity function
   * @param {[Array | String | Expression]} args
   *  array of complex numbers, strings, or Expressions
   */
  constructor(operation, args) {
    this.operation = operation === null ? identity : operation
    this.args = args
  }

  get complexity() {
    const { operation, args } = this
    if (operation !== identity) return args.reduce((acc, subtree) => acc + subtree.complexity, 1)
    return 1
  }

  evaluate(options = { degreeMode: false, complexMode: true }, variable, c) {
    const { operation, args } = this
    const length = functionArgsLengths[operation.name]
    if (length && args.length > length)
      throw new DomainError(`Max number of arguments expected for ${operation.name}: ${length}.`)
    if (functions[operation.name]) {
      const mappedArgs = args.map((arg) => arg.evaluate(options, variable, c))
      if (mappedArgs.some((arg) => arg instanceof Expression)) {
        const unMappedArgs = mappedArgs.map((arg) => {
          if (arg instanceof Expression) return arg
          return new Expression(null, [arg])
        })
        return new Expression(operation, unMappedArgs)
      }
      const evaluation = trigFunctions.some((func) => operation.name.includes(func))
        ? operation(...mappedArgs, options.degreeMode)
        : operation(...mappedArgs)
      if (!options.complexMode && evaluation[1] !== 0)
        throw new NonrealError("Nonreal answer or argument.")
      return evaluation
    }
    if (operation === identity) {
      const arg = args[0]
      if (typeof arg === "string") {
        const found = functionNamesList.find((func) => arg.includes(func))
        if (found) throw new DomainError(`Use parenthesis around argument of ${found}.`)
        if (arg.length === 0) throw new DomainError("Missing operand or argument.")
        if (arg.length > 1 && !/d[a-z]/.test(arg))
          throw new DomainError(`Variable: ${arg} must be a single character.`)
        if (!variable || variable !== arg) return this
        if (!c) throw new DomainError(`No value provided for ${arg}.`)
        return operation(c)
      }
      return operation(arg)
    }
    return operation(...args)
  }

  substitute(variable, { operation, args }) {
    if (this.operation === identity) {
      if (this.args[0] === variable) return new Expression(operation, args)
      return this
    }
    return new Expression(
      this.operation,
      this.args.map((arg) => arg.substitute(variable, { operation, args }))
    )
  }

  isFunctionOf(variable, only = false) {
    const argIsCorrectVar = (arg) => {
      if (arg instanceof Expression) return arg.isFunctionOf(variable, only)
      if (typeof arg === "string") return arg === variable
      return only
    }
    return only ? this.args.every(argIsCorrectVar) : this.args.some(argIsCorrectVar)
  }

  isNumber() {
    try {
      return !(this.evaluate() instanceof Expression)
    } catch {
      return false
    }
  }

  isIdenticalTo({ operation, args }) {
    if (this.operation !== operation) return false
    return this.args.every((arg, i) => {
      if (arg instanceof Expression) {
        if (args[i] instanceof Expression) return arg.isIdenticalTo(args[i])
        return false
      }
      if (typeof arg === "string") return arg === args[i]
      return arg.every((value, j) => value === args[i][j])
    })
  }

  toString() {
    const { operation, args } = this
    if (operation !== identity)
      return `${operation.name}(${args.map((arg) => arg.toString()).join(",")})`
    if (typeof args[0] === "string") return args[0]
    return `[${args[0]}]`
  }
}
