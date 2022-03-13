/**
 * Simplification rulesets.
 */

import createTree from "../tree/CreateTree.mjs"
import { parseInput } from "../shared/Parsing.mjs"
import display from "./Display.mjs"

import Expression from "../tree/Expression.mjs"
import { isInteger, sgn, abs, intPow, round } from "../functions/Real.mjs"
import * as functions from "../functions/Complex.mjs"

const newExp = (op, args) => {
  if (!op) return new Expression(null, args)
  return new Expression(functions[op], args)
}

const newC = (c) => newExp(null, [c])

/**
 * Compares two complex numbers or one user variable and one complex number.
 */
const isSameConst = (c1, c2) => c1[0] === c2[0] && c1[1] === c2[1]

/**
 * Rounds a complex number unless precision can be maintained.
 */
const roundComplex = (c, n) => {
  c[0] = abs(c[0]) < intPow(10, -n) ? c[0] : round(c[0], n)
  c[1] = abs(c[1]) < intPow(10, -n) ? c[1] : round(c[1], n)
  return [round(c[0], n), round(c[1], n)]
}

/**
 * Checks if a complex number has integer real and imaginary parts.
 */
const isGaussianInt = (c) => {
  c = roundComplex(c, 16)
  return isInteger(c[0]) && isInteger(c[1])
}

/**
 * Function for filtering out a given complex number.
 */
const isNot = (c) => {
  return ({ operation, args }) => !(operation.name === "identity" && isSameConst(args[0], c))
}

/**
 * Checks for a basic constant without any operations.
 */
const isBasicConst = ({ operation, args }) =>
  operation.name === "identity" && Array.isArray(args[0])

/**
 * Checks for a basic constant that are not mathematical constants.
 */
const isRationalConst = ({ operation, args }) =>
  isBasicConst({ operation, args }) && !(typeof args[0][0] === "string")

/**
 * Checks for differentials.
 */
const isDifferential = ({ operation, args }) =>
  operation.name === "identity" && /^d+[a-z]$/.test(args[0])

/**
 * Compares a basic constant to a given complex number.
 */
const isEquivalent = ({ operation, args }, c) =>
  isBasicConst({ operation, args }) && isSameConst(args[0], c)

/**
 * Sorts by: differentials > basic numbers > evaluable numbers > complexity > default sort
 * Addition reverses basic numbers, evaluable numbers, complexity.
 */
const sortOrder = (op) => {
  return (argA, argB) =>
    16 * (isDifferential(argA) - isDifferential(argB)) +
    (op === "add" ? -1 : 1) *
      (8 * (isBasicConst(argB) - isBasicConst(argA)) +
        4 * (argB.isNumber() - argA.isNumber()) +
        2 * sgn(argA.complexity - argB.complexity)) +
    (argA > argB ? 1 : -1)
}
/**
 * Checks for a negative leading coefficient.
 */
const isNegativeLeading = ({ operation, args }) => {
  if (isBasicConst({ operation, args }) && args[0][0] < 0) return true
  if (operation.name === "multiply" && isBasicConst(args[0]) && args[0].args[0][0] < 0) return true
  if (operation.name === "add") return isNegativeLeading(args[0])
  return false
}

/**
 * Returns the result of splicing an array without mutating it.
 * @param {Number} i index of array to remove
 * @param {Number} n number of elements to remove
 * @returns {Array} resulting array
 */
Array.prototype.remove = function (i, n = 1) {
  return this.slice(0, i).concat(this.slice(i + n))
}

/**
 * Recursively simplifies until the identity function is reached.
 * Evaluates Gaussian integers when possible.
 * @param {Expression} tree
 * @returns {Expression} simplified Expression
 */
export default function simplify(tree, options = { factor: true }) {
  const evaluation = tree.evaluate()
  if (Array.isArray(evaluation)) {
    if (isNaN(evaluation[0]) || isNaN(evaluation[1])) return newC([NaN, NaN])
    if (isGaussianInt(evaluation)) return newC(evaluation)
  }
  if (!rules[tree.operation.name]) return rules.identity(tree, options) // TODO: remove this after rules are set
  const simplified = rules[tree.operation.name](tree, options)
  if (tree.isIdenticalTo(simplified)) return simplified
  //console.log(tree.toString(),display(tree),"\n")
  return simplify(simplified, options)
}

const rules = {
  identity: (x) => x,

  add: ({ args }, options) => {
    args = args.filter(isNot([0, 0]))
    if (args.length === 0) return newC([0, 0])
    if (args.length === 1) return simplify(args[0], options)
    const numbers = args.filter((arg) => isRationalConst(arg))
    const rest = args.filter((arg) => !isRationalConst(arg))
    const sum = newC(newExp("add", numbers).evaluate())
    if (rest.length === 0) return sum
    args = [sum, ...rest]
    args = args.filter(isNot([0, 0]))
    args.sort(sortOrder("add"))
    // combines all arguments for addition operations
    for (let i = 0; i < args.length; i++) {
      if (args[i].operation.name === "add")
        return simplify(newExp("add", [...args.remove(i), ...args[i].args]), options)
    }
    // uses common denominator to simplify
    for (let i = 0; i < args.length; i++) {
      if (args[i].operation.name === "divide") {
        const numerator = args[i].args[0]
        const denominator = args[i].args[1]
        return simplify(
          newExp("divide", [
            newExp("add", [
              newExp("multiply", [denominator, newExp("add", args.remove(i))]),
              numerator,
            ]),
            denominator,
          ]),
          options
        )
      }
    }
    // wraps each summand as a product, and then as an exponent if necessary
    for (let a = 0; a < args.length; a++) {
      let sumA = args[a]
      if (sumA.operation.name !== "multiply") {
        sumA = newExp("multiply", [newC([1, 0]), sumA])
      }
      for (let b = a + 1; b < args.length; b++) {
        let sumB = args[b]
        if (sumB.operation.name !== "multiply") {
          sumB = newExp("multiply", [newC([1, 0]), sumB])
        }
        for (let c = 0; c < sumA.args.length; c++) {
          let productC = sumA.args[c]
          if (productC.operation.name !== "pow") {
            productC = newExp("pow", [productC, newC([1, 0])])
          }
          for (let d = 0; d < sumB.args.length; d++) {
            let productD = sumB.args[d]
            if (productD.operation.name !== "pow") {
              productD = newExp("pow", [productD, newC([1, 0])])
            }
            // combines like terms
            if (
              productC.isIdenticalTo(productD) &&
              !isEquivalent(productC.args[0], [1, 0]) &&
              sumA.args.remove(c).length === 1 &&
              sumB.args.remove(d).length === 1 &&
              isRationalConst(sumA.args.remove(c)[0]) &&
              isRationalConst(sumB.args.remove(d)[0])
            ) {
              args[a] = newExp("multiply", [
                simplify(newExp("add", [sumA.args.remove(c)[0], sumB.args.remove(d)[0]]), options),
                productC,
              ])
              return simplify(newExp("add", args.remove(b)), options)
            }
            // TODO: implement Cantor–Zassenhaus algorithm instead of term by term
            const baseA = productC.args[0]
            const baseB = productD.args[0]
            const exponentA = productC.args[1]
            const exponentB = productD.args[1]
            if (
              options.factor &&
              baseA.isIdenticalTo(baseB) &&
              exponentA.isNumber() &&
              exponentA.evaluate()[0] >= 1 &&
              exponentB.isNumber() &&
              exponentB.evaluate()[0] >= 1 &&
              !isRationalConst(baseA)
            ) {
              productC = newExp("pow", [baseA, newExp("add", [newC([-1, 0]), exponentA])])
              productD = newExp("pow", [baseB, newExp("add", [newC([-1, 0]), exponentB])])
              args[a] = newExp("multiply", [
                newExp("add", [
                  newExp("multiply", [productC, ...sumA.args.remove(c)]),
                  newExp("multiply", [productD, ...sumB.args.remove(d)]),
                ]),
                baseA,
              ])
              return simplify(newExp("add", args.remove(b)), options)
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
    if (isEquivalent(args[1], [0, 0])) return simplify(args[0], options)
    const subtracted = newExp("multiply", [newC([-1, 0]), args[1]])
    if (isEquivalent(args[0], [0, 0])) return simplify(subtracted, options)
    // eliminates subtraction in favor of addition and negation
    return simplify(newExp("add", [args[0], subtracted]), options)
  },

  multiply: ({ args }, options) => {
    if (args.some((arg) => isEquivalent(arg, [0, 0]))) return newC([0, 0])
    args = args.filter(isNot([1, 0]))
    if (args.length === 0) return newC([1, 0])
    if (args.length === 1) return simplify(args[0], options)
    const numbers = args.filter((arg) => isRationalConst(arg))
    const rest = args.filter((arg) => !isRationalConst(arg))
    const product = newC(newExp("multiply", numbers).evaluate())
    if (rest.length === 0) return product
    // distributes all rational constants
    // if (!isEquivalent(product, [1, 0]) && rest.length === 1 && rest[0].operation.name === "add") {
    //   const sums = []
    //   for (let i = 0; i < rest[0].args.length; i++) {
    //     sums.push(newExp("multiply", [product, rest[0].args[i]]))
    //   }
    //   return simplify(newExp("add", sums), options)
    // }
    args = [product, ...rest]
    args = args.filter(isNot([1, 0]))
    args.sort(sortOrder("multiply"))
    // combines all arguments for multiplication operations
    for (let i = 0; i < args.length; i++) {
      if (args[i].operation.name === "multiply")
        return simplify(newExp("multiply", [...args.remove(i), ...args[i].args]), options)
    }
    // combines into single fraction
    for (let i = 0; i < args.length; i++) {
      if (args[i].operation.name === "divide") {
        const denominator = args[i].args[1]
        const numerator = args[i].args[0]
        return simplify(
          newExp("divide", [newExp("multiply", [numerator, ...args.remove(i)]), denominator]),
          options
        )
      }
    }
    // distributes all if factoring disabled
    if (!options.factor) {
      for (let i = 0; i < args.length; i++) {
        if (args[i].operation.name === "add") {
          const sums = []
          for (let j = 0; j < args[i].args.length; j++) {
            sums.push(newExp("multiply", [...args.remove(i), args[i].args[j]]))
          }
          return simplify(newExp("add", sums), options)
        }
      }
    }
    // combines common bases and common exponents with constant bases, wraps in power if necessary
    for (let i = 0; i < args.length; i++) {
      let productA = args[i]
      if (productA.operation.name !== "pow") productA = newExp("pow", [productA, newC([1, 0])])
      for (let j = i + 1; j < args.length; j++) {
        let productB = args[j]
        if (productB.operation.name !== "pow") productB = newExp("pow", [productB, newC([1, 0])])
        const baseA = productA.args[0]
        const baseB = productB.args[0]
        const exponentA = productA.args[1]
        const exponentB = productB.args[1]
        if (baseA.isIdenticalTo(baseB)) {
          args[j] = newExp("pow", [baseA, newExp("add", [exponentA, exponentB])])
          return simplify(newExp("multiply", args.remove(i)), options)
        }
        if (
          exponentA.isIdenticalTo(exponentB) &&
          isRationalConst(baseA) &&
          isRationalConst(baseB) &&
          !isEquivalent(exponentA, [1, 0])
        ) {
          args[j] = newExp("pow", [newExp("multiply", [baseA, baseB]), exponentA])
          return simplify(newExp("multiply", args.remove(i)), options)
        }
      }
    }
    return newExp(
      "multiply",
      args.map((arg) => simplify(arg, options))
    )
  },

  divide: ({ args }, options) => {
    if (isEquivalent(args[0], [0, 0]) && !isEquivalent(args[1], [0, 0])) return newC([0, 0])
    if (args[0].isIdenticalTo(args[1]) && !isEquivalent(args[1], [0, 0])) return newC([1, 0])
    if (isEquivalent(args[1], [1, 0])) return simplify(args[0], options)
    // removes negative leading coefficient in denominator
    if (isNegativeLeading(simplify(args[1], options))) {
      return simplify(
        newExp("divide", [
          simplify(newExp("multiply", [newC([-1, 0]), args[0]]), options),
          simplify(newExp("multiply", [newC([-1, 0]), args[1]]), options),
        ]),
        options
      )
    }
    let top = args[0]
    let bot = args[1]
    // simplifies fraction in fraction
    if (top.operation.name === "divide") {
      const numerator = top.args[0]
      top = top.args[1]
      return simplify(newExp("divide", [numerator, newExp("multiply", [top, bot])]), options)
    }
    if (bot.operation.name === "divide") {
      const denominator = args[1].args[0]
      bot = bot.args[1]
      return simplify(newExp("divide", [newExp("multiply", [top, bot]), denominator]), options)
    }
    // simplifies quotient of powers, wrap in multiplication if necessary
    if (top.operation.name !== "multiply") top = newExp("multiply", [newC([1, 0]), top])
    if (bot.operation.name !== "multiply") bot = newExp("multiply", [newC([1, 0]), bot])
    for (let i = 0; i < top.args.length; i++) {
      const productA = top.args[i]
      for (let j = 0; j < bot.args.length; j++) {
        const productB = bot.args[j]
        if (productA.isIdenticalTo(productB)) {
          top.args[i] = newC([1, 0])
          bot.args[j] = newC([1, 0])
        }
        if (productA.operation.name === "pow" && productB.isIdenticalTo(productA.args[0])) {
          top.args[i] = newExp("pow", [productB, newExp("add", [newC([-1, 0]), productA.args[1]])])
          bot.args[j] = newC([1, 0])
        }
        if (productB.operation.name === "pow" && productA.isIdenticalTo(productB.args[0])) {
          bot.args[j] = newExp("pow", [productA, newExp("add", [newC([-1, 0]), productB.args[1]])])
          top.args[i] = newC([1, 0])
        }
        if (productA.operation.name === "pow" && productB.operation.name === "pow") {
          const baseA = productA.args[0]
          const baseB = productB.args[0]
          const exponentA = productA.args[1]
          const exponentB = productB.args[1]
          if (baseA.isIdenticalTo(baseB)) {
            top.args[i] = newExp("pow", [
              baseA,
              newExp("add", [exponentA, newExp("multiply", [newC([-1, 0]), exponentB])]),
            ])
            bot.args[j] = newC([1, 0])
          }
          if (
            exponentA.isIdenticalTo(exponentB) &&
            isRationalConst(baseA) &&
            isRationalConst(baseB)
          ) {
            top.args[i] = newExp("pow", [newExp("divide", [baseA, baseB]), exponentA])
            bot.args[j] = newC([1, 0])
          }
        }
      }
    }
    return newExp("divide", [simplify(top, options), simplify(bot, options)])
  },

  pow: ({ args }, options) => {
    if (isEquivalent(args[0], [0, 0]) && !isEquivalent(args[1], [0, 0])) return newC([0, 0])
    if (isEquivalent(args[1], [0, 0]) && !isEquivalent(args[0], [0, 0])) return newC([1, 0])
    if (isEquivalent(args[0], [1, 0]) && args[1][0] !== Infinity) return newC([1, 0])
    if (isEquivalent(args[1], [1, 0])) return simplify(args[0], options)

    return newExp(
      "pow",
      args.map((arg) => simplify(arg, options))
    )
  },
}

// const factor = true
// const userInput = "multiply(add(multiply(dx,ln(x)),multiply(x,divide(dx,x))))"
// console.log(parseInput(userInput))
// console.log(simplify(createTree(parseInput(userInput)), { factor }).toString())
// console.log(display(simplify(createTree(parseInput(userInput)), { factor })))
