/**
 * Simplification rulesets.
 */

import createTree from "../tree/CreateTree.mjs"
import { parseInput } from "../shared/Parsing.mjs"

import Expression, { identity } from "../tree/Expression.mjs"
import * as functions from "../functions/Complex.mjs"

export default function simplify(tree) {
  const name = tree.operation.name
  return simplifyRules[name](tree)
}

const newExp = (op, args) => {
  if (!op || op === "identity") return new Expression(null, args)
  return new Expression(functions[op], args)
}

const isSame = (c1, c2) => c1[0] === c2[0] && c1[1] === c2[1]

const isNot = (c) => {
  return ({ operation, args }) => !(operation === identity && isSame(args[0], c))
}

const isBasicConst = ({ operation, args }) => operation === identity && Array.isArray(args[0])

const isSimpleConst = ({ operation, args }) =>
  isBasicConst({ operation, args }) && !(typeof args[0][0] === "string")

const sgn = (x) => {
  if (x > 0) return 1
  if (x < 0) return -1
  return 0
}

const sortOrder = (argA, argB) =>
  16 * (isBasicConst(argB) - isBasicConst(argA)) +
  8 * (argB.isEvaluable() - argA.isEvaluable()) +
  4 * sgn(argA.leaves - argB.leaves) +
  2 * sgn(argA.toString().length - argB.toString().length) +
  1 * (argA > argB ? 1 : -1)

const simplifyRules = {
  identity: (x) => x,

  add: ({ args }) => {
    args = args.filter(isNot([0, 0]))
    if (args.length === 0) return newExp(null, [[0, 0]])
    if (args.length === 1) return newExp(args[0].operation.name, args[0].args)
    const numbers = args.filter((arg) => isSimpleConst(arg))
    const rest = args.filter((arg) => !isSimpleConst(arg))
    const sum = newExp(null, [newExp("add", numbers).evaluate()])
    if (rest.length === 0) return sum
    if (numbers.length == 0 && rest.length == 1) return newExp(null, [rest[0]])
    args = [sum, ...rest]
    args = args.filter(isNot([0, 0]))
    args.sort(sortOrder)

    return newExp("add", args)
  },
}

const userInput = "sin(x)+sin(sin(x))"
console.log(parseInput(userInput))
console.log(simplify(createTree(parseInput(userInput))).toString())
