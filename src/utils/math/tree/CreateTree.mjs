import { FunctionError } from "../shared/Errors.mjs"
import Expression from "./Expression.mjs"
import { parseExp } from "../shared/Parsing.mjs"
import * as functions from "../functions/Complex.mjs"
import * as symbolics from "../functions/Symbolic.mjs"

/**
 * Recursively adds Expressions until an argument is a single variable or complex number.
 * The identity function is named as the operation for these arguments.
 * @param {String} expression a parsed expression string
 * @returns {Expression} an Expression object from the parsed expression string
 */
export default function createTree(expression) {
  const { args, name } = parseExp(expression)
  if (name === "identity") {
    if (/^\[[^,]+,[^,]+\]$/.test(args)) { // RegExp.test works on arrays?
      const complexNum = args[0]
        .slice(1, -1)
        .split(",")
        .map((value) => (value === "0" ? 0 : Number(value) || value))
      return new Expression(null, [complexNum])
    }
    return new Expression(null, args)
  }
  return new Expression(
    functions[name] ||
      symbolics[name] ||
      function badFunction() {
        throw new FunctionError(`Function: ${name} is not supported.`)
      },
    args.map((arg) => createTree(arg))
  )
}
