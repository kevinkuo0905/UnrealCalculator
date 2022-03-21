/**
 * Differentiation rules.
 * TODO: arccsc, arcsec, arccot
 */

import { FunctionError, DomainError } from "./Errors.mjs"
import Expression from "../tree/Expression.mjs"
import * as functions from "../functions/Complex.mjs"

/**
 * Recursively differentiates until the identity function is reached.
 * Evaluates simplifiable arguments within if necessary.
 * @param {Expression} tree
 * @returns {Expression} differentiated Expression
 */
export default function differentiate(tree) {
  const name = tree.operation.name
  if (!rules[name]) {
    if (tree.isNumber()) return newC([0, 0])
    const evaluation = tree.evaluate()
    if (evaluation.isIdenticalTo(tree))
      throw new FunctionError(`Function: ${name} is not differentiable.`)
    return differentiate(evaluation)
  }
  if (name !== "identity")
    tree.args = tree.args.map((arg) => {
      if (!rules[arg.operation.name]) {
        if (arg.isNumber()) return newC(arg.evaluate())
        return arg.evaluate()
      }
      return arg
    })
  return rules[name](tree)
}

const newExp = (op, args) => {
  if (!op) return new Expression(null, args)
  return new Expression(functions[op], args)
}

const newC = (c) => newExp(null, [c])

const rules = {
  identity: ({ args: [arg] }) => {
    if (arg === "") throw new DomainError("Missing operand or argument.")
    if (Array.isArray(arg)) return newC([0, 0])
    return newC(`d${arg}`)
  },

  add: ({ args }) => {
    const diffArgs = args.map((arg) => differentiate(arg))
    return newExp("add", diffArgs)
  },

  subtract: ({ args }) => {
    const diffArgs = args.map((arg) => differentiate(arg))
    return newExp("subtract", diffArgs)
  },

  multiply: ({ args }) => {
    const diffArgs = args.map((arg) => differentiate(arg))
    const sumArgs = []
    for (let i = 0; i < args.length; i++) {
      const productArgs = []
      for (let j = 0; j < args.length; j++) {
        if (i !== j) {
          productArgs.push(args[j])
        } else {
          productArgs.push(diffArgs[j])
        }
      }
      sumArgs.push(newExp("multiply", productArgs))
    }
    return newExp("add", sumArgs)
  },

  divide: ({ args }) => {
    const diffArgs = args.map((arg) => differentiate(arg))
    return newExp("divide", [
      newExp("subtract", [
        newExp("multiply", [args[1], diffArgs[0]]),
        newExp("multiply", [args[0], diffArgs[1]]),
      ]),
      newExp("multiply", [args[1], args[1]]),
    ])
  },

  abs: ({ args: [arg] }) => {
    return newExp("divide", [newExp("multiply", [arg, differentiate(arg)]), newExp("abs", [arg])])
  },

  exp: ({ args: [arg] }) => {
    return newExp("multiply", [newExp("exp", [arg]), differentiate(arg)])
  },

  ln: ({ args: [arg] }) => {
    return newExp("divide", [differentiate(arg), arg])
  },

  log: ({ args: [arg] }) => {
    return newExp("divide", [
      differentiate(arg),
      newExp("multiply", [newExp("ln", [newC([10, 0])]), arg]),
    ])
  },

  pow: ({ args }) => {
    if (args[1].isNumber()) {
      return newExp("multiply", [
        args[1],
        newExp("pow", [args[0], newExp("subtract", [args[1], newC([1, 0])])]),
        differentiate(args[0]),
      ])
    }
    return newExp("multiply", [
      newExp("pow", [args[0], args[1]]),
      differentiate(newExp("multiply", [args[1], newExp("ln", [args[0]])])),
    ])
  },

  sqrt: ({ args: [arg] }) => {
    return newExp("divide", [
      differentiate(arg),
      newExp("multiply", [newC([2, 0]), newExp("sqrt", [arg])]),
    ])
  },

  sin: ({ args: [arg] }) => {
    return newExp("multiply", [newExp("cos", [arg]), differentiate(arg)])
  },

  cos: ({ args: [arg] }) => {
    return newExp("multiply", [newC([-1, 0]), newExp("sin", [arg]), differentiate(arg)])
  },

  tan: ({ args: [arg] }) => {
    return newExp("multiply", [newExp("sec", [arg]), newExp("sec", [arg]), differentiate(arg)])
  },

  csc: ({ args: [arg] }) => {
    return newExp("multiply", [
      newC([-1, 0]),
      newExp("csc", [arg]),
      newExp("cot", [arg]),
      differentiate(arg),
    ])
  },

  sec: ({ args: [arg] }) => {
    return newExp("multiply", [newExp("sec", [arg]), newExp("tan", [arg]), differentiate(arg)])
  },

  cot: ({ args: [arg] }) => {
    return newExp("multiply", [
      newC([-1, 0]),
      newExp("csc", [arg]),
      newExp("csc", [arg]),
      differentiate(arg),
    ])
  },

  arcsin: ({ args: [arg] }) => {
    return newExp("divide", [
      differentiate(arg),
      newExp("sqrt", [newExp("subtract", [newC([1, 0]), newExp("multiply", [arg, arg])])]),
    ])
  },

  arccos: ({ args: [arg] }) => {
    return newExp("divide", [
      newExp("multiply", [newC([-1, 0]), differentiate(arg)]),
      newExp("sqrt", [newExp("subtract", [newC([1, 0]), newExp("multiply", [arg, arg])])]),
    ])
  },

  arctan: ({ args: [arg] }) => {
    return newExp("divide", [
      differentiate(arg),
      newExp("add", [newC([1, 0]), newExp("multiply", [arg, arg])]),
    ])
  },
}
