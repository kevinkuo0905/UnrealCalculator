import { NonrealError } from "../shared/Errors.mjs"
import { e, pi } from "../functions/Real.mjs"
import * as symbolics from "../symbolic-functions/Symbolic.mjs"

const trigFunctions = ["sin", "cos", "tan", "csc", "sec", "cot"]

/**
 * The identity function converts a mathematical constant stored as a string into a number when an
 * evaluation is called.
 * @param {[(String | Number), Number] | String} x
 * @returns {[Number, Number] | String}
 */
const identity = (x) => {
  if (Array.isArray(x) && x.length === 2) {
    if (x[0] === "pi") return [pi, 0]
    if (x[0] === "e") return [e, 0]
  }
  return x
}

/**
 * A class with operations and arguments: each argument may be complex numbers, strings, or other
 * Expression objects, creating an abstract syntax tree.
 * An expression object containing strings are function expressions of that string variable.
 * An expression object containing only complex numbers as arguments for the leaves of the tree is
 * evaluable and are considered constants.
 */
export default class Expression {
  /**
   * @param {Function} operation
   *  mathematical function or operation, null operation is replaced with the identity function
   * @param {[[any] | String | Expression]} args
   *  array of complex numbers, strings, or Expressions
   */
  constructor(operation, args) {
    this.operation = operation === null ? identity : operation
    this.args = args
  }

  get leaves() {
    const { operation, args } = this
    if (operation !== identity) {
      return args.reduce((acc, subtree) => acc + subtree.leaves, 0)
    }
    return 1
  }

  evaluate({ degreeMode = false, complexMode = true } = {}, variable, c) {
    const { operation, args } = this
    if (symbolics[operation.name]) return operation(...args)
    if (operation !== identity) {
      const mappedArgs = args.map((arg) => arg.evaluate({ degreeMode, complexMode }, variable, c))
      const evaluation = trigFunctions.some((func) => operation.name.includes(func))
        ? operation(...mappedArgs, degreeMode)
        : operation(...mappedArgs)
      if (!complexMode && evaluation[1] !== 0) throw new NonrealError("Nonreal answer or argument.")
      return evaluation
    }
    const arg = args[0]
    if (typeof arg === "string") {
      if (arg.length === 0) throw new EvalError("Missing argument in function.")
      if (!variable) throw new EvalError(`${arg} is a variable.`)
      if (arg !== variable) throw new EvalError(`This is a function of ${arg}.`)
      if (!c) throw new EvalError(`No value provided for ${arg}.`)
      return operation(c)
    }
    return operation(arg)
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

  isEvaluable() {
    return this.args.every((arg) => {
      if (arg instanceof Expression) return arg.isEvaluable()
      return !(typeof arg === "string")
    })
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
