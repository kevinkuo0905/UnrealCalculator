/**
 * Simplification rulesets.
 */

import createTree from "../tree/CreateTree.mjs"
import { parseInput } from "../shared/Parsing.mjs"
import Expression from "../tree/Expression.mjs"
import * as functions from "../functions/Complex.mjs"

const newExp = (op, args) => {
  if (!op || op === "identity") return new Expression(null, args)
  return new Expression(functions[op], args)
}

const newC = (c) => newExp(null, [c])

const isSame = (c1, c2) => c1[0] === c2[0] && c1[1] === c2[1]

const isNot = (c) => {
  return ({ operation, args }) => !(operation.name === "identity" && isSame(args[0], c))
}

const isBasicConst = ({ operation, args }) =>
  operation.name === "identity" && Array.isArray(args[0]) && args[0].length === 2

const isSimpleConst = ({ operation, args }) =>
  isBasicConst({ operation, args }) && !(typeof args[0][0] === "string")

const isEqual = ({ operation, args }, c) => {
  return isBasicConst({ operation, args }) && isSame(args[0], c)
}

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

Array.prototype.remove = function (i) {
  return this.slice(0, i).concat(this.slice(i + 1))
}

export default function simplify(tree, options) {
  const name = tree.operation.name
  return simplifyRules[name](tree, options)
}

const simplifyRules = {
  identity: (x) => x,

  add: ({ args }, options) => {
    args = args.filter(isNot([0, 0]))
    if (args.length === 0) return newC([0, 0])
    if (args.length === 1) return simplify(newExp(args[0].operation.name, args[0].args), options)
    const numbers = args.filter((arg) => isSimpleConst(arg))
    const rest = args.filter((arg) => !isSimpleConst(arg))
    const sum = newC(newExp("add", numbers).evaluate())
    if (rest.length === 0) return sum
    args = [sum, ...rest]
    args = args.filter(isNot([0, 0]))
    args.sort(sortOrder)
    for (let i = 0; i < args.length; i++) {
      if (args[i].operation.name === "divide") {
        const numerator = args[i].args[0]
        const denominator = args[i].args[1]
        args.splice(i, 1)
        return simplify(
          newExp("divide", [
            newExp("add", [newExp("multiply", [denominator, newExp("add", args)]), numerator]),
            denominator,
          ]),
          options
        )
      }
    }
    for (let a = 0; a < args.length; a++) {
      let sumA = args[a]
      if (sumA.operation.name !== "multiply") sumA = newExp("multiply", [newC([1, 0]), sumA])
      for (let b = a + 1; b < args.length; b++) {
        let sumB = args[b]
        if (sumB.operation.name !== "multiply") sumB = newExp("multiply", [newC([1, 0]), sumB])
        for (let c = 0; c < sumA.args.length; c++) {
          let productC = sumA.args[c]
          if (productC.operation.name !== "pow") productC = newExp("pow", [productC, newC([1, 0])])
          for (let d = 0; d < sumB.args.length; d++) {
            let productD = sumB.args[d]
            if (productD.operation.name !== "pow")
              productD = newExp("pow", [productD, newC([1, 0])])
            // combine like terms
            const sum = newExp("add", [
              newExp("multiply", sumA.args.remove(c)),
              newExp("multiply", sumB.args.remove(d)),
            ])
            if (
              productC.isIdenticalTo(productD) &&
              !isEqual(productC.args[0], [1, 0]) &&
              sum.isEvaluable()
            ) {
              args[a].args.splice(c, 1)
              args[b].args.splice(d, 1)
              args[a] = newExp("multiply", [sum, productC])
              args.splice(b, 1)
              return simplify(newExp("add", args), options)
            }
            // TODO: implement Cantor–Zassenhaus algorithm
            const baseA = productC.args[0]
            const baseB = productD.args[0]
            const exponentA = productC.args[1]
            const exponentB = productD.args[1]
            if (
              options.factor &&
              baseA.isIdenticalTo(baseB) &&
              exponentA.isEvaluable() &&
              exponentA.evaluate()[0] >= 1 &&
              exponentB.isEvaluable() &&
              exponentB.evaluate()[0] >= 1 &&
              !isSimpleConst(baseA)
            ) {
              args[a].args[c] = newExp("pow", [baseA, newExp("add", [newC([-1, 0]), exponentA])])
              args[b].args[d] = newExp("pow", [baseB, newExp("add", [newC([-1, 0]), exponentB])])
              args[a] = newExp("multiply", [
                newExp("add", [newExp("multiply", args[a].args), newExp("multiply", args[b].args)]),
                baseA,
              ])
              args.splice(b, 1)
              return simplify(newExp("add", args), options)
            }
          }
        }
      }
    }
    return newExp(
      "add",
      args.map((arg) => simplify(arg, options))
    )
  },

  subtract: ({ args }, options) => {
    if (args[0].isIdenticalTo(args[1])) return newC([0, 0])
    if (isEqual(args[1], [0, 0])) return args[0]
    const subtracted = newExp("multiply", [newC([-1, 0]), args[1]])
    if (isEqual(args[0], [0, 0])) return subtracted
    return simplify(newExp("add", [args[0], subtracted]), options)
  },

  multiply: ({ args }, options) => {
    if (args.some((arg) => isEqual(arg, [0, 0]))) return newC([0, 0])
    args = args.filter(isNot([1, 0]))
    if (args.length === 0) return newC([1, 0])
    if (args.length === 1) return args[0]
    const numbers = args.filter((arg) => isSimpleConst(arg))
    const rest = args.filter((arg) => !isSimpleConst(arg))
    const product = newC(newExp("multiply", numbers).evaluate())
    if (rest.length === 0) return product
    if (!isEqual(product, [1, 0]) && rest.length === 1 && rest[0].operation.name === "add") {
      const sums = []
      for (let i = 0; i < rest[0].args.length; i++) {
        sums.push(newExp("multiply", [product, rest[0].args[i]]))
      }
      return simplify(newExp("add", sums), options)
    }
    args = [product, ...rest]
    args = args.filter(isNot([1, 0]))
    args.sort(sortOrder)
    for (let i = 0; i < args.length; i++) {
      if (args[i].operation.name === "divide") {
        const denominator = args[i].args[1]
        const numerator = args[i].args[0]
        args.splice(i, 1)
        return simplify(
          newExp("divide", [newExp("multiply", [numerator, ...args]), denominator]),
          options
        )
      }
    }
    
    return newExp(
      "multiply",
      args.map((arg) => simplify(arg, options))
    )
  },

  divide: (x) => x,
}

const userInput = "4*(2+3+x)"
console.log(parseInput(userInput))
console.log(simplify(createTree(parseInput(userInput)), { factor: true }).toString())



