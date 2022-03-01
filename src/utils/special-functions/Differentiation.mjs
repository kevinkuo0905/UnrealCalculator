/**
 * Differentiation rules.
 * TODO: arccsc, arcsec, arccot
 */

import createTree from "../tree/CreateTree.mjs"
import { parseInput } from "../shared/Parsing.mjs"

import { FunctionError } from "../shared/Errors.mjs"
import Expression from "../tree/Expression.mjs"
import * as functions from "../functions/Complex.mjs"

export default function diff(tree, variable, implicit = false) {
  const name = tree.operation.name
  if (!diffRules[name]) throw new FunctionError(`${name} is not differentiable.`)
  return diffRules[name](tree, variable, implicit)
}

const newExp = (op, args) => {
  if (!op || op === "identity") return new Expression(null, args)
  return new Expression(functions[op], args)
}

const diffRules = {
  identity: ({ args: [arg] }, variable, implicit) => {
    if (arg === variable) return newExp(null, [[1, 0]])
    if (Array.isArray(arg) && arg.length === 2) return newExp(null, [[0, 0]])
    if (implicit) return newExp(null, [`d${arg}/d${variable}`])
    return newExp(null, [[0, 0]])
  },

  add: ({ args }, variable, implicit) => {
    const diffArgs = args.map((arg) => diff(arg, variable, implicit))
    return newExp("add", diffArgs)
  },

  subtract: ({ args }, variable, implicit) => {
    const diffArgs = args.map((arg) => diff(arg, variable, implicit))
    return newExp("subtract", diffArgs)
  },

  multiply: ({ args }, variable, implicit) => {
    const diffArgs = args.map((arg) => diff(arg, variable, implicit))
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

  divide: ({ args }, variable, implicit) => {
    const diffArgs = args.map((arg) => diff(arg, variable, implicit))
    return newExp("divide", [
      newExp("subtract", [
        newExp("multiply", [args[1], diffArgs[0]]),
        newExp("multiply", [args[0], diffArgs[1]]),
      ]),
      newExp("multiply", [args[1], args[1]]),
    ])
  },

  abs: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("divide", [newExp("multiply", [arg, diffArg]), newExp("abs", [arg])])
  },

  exp: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("multiply", [newExp("exp", [arg]), diffArg])
  },

  ln: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("divide", [diffArg, arg])
  },

  log: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("divide", [
      diffArg,
      newExp("multiply", [newExp("ln", [newExp(null, [[10, 0]])]), arg]),
    ])
  },

  pow: ({ args }, variable, implicit) => {
    if (args[1].isConstant()) {
      const diffArg = diff(args[0], variable, implicit)
      return newExp("multiply", [
        args[1],
        newExp("pow", [args[0], newExp("subtract", [args[1], newExp(null, [[1, 0]])])]),
        diffArg,
      ])
    }
    return newExp("multiply", [
      newExp("pow", [args[0], args[1]]),
      diff(newExp("multiply", [args[1], newExp("ln", [args[0]])]), variable, implicit),
    ])
  },

  sqrt: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("divide", [
      diffArg,
      newExp("multiply", [newExp(null, [[2, 0]]), newExp("sqrt", [arg])]),
    ])
  },

  sin: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("multiply", [newExp("cos", [arg]), diffArg])
  },

  cos: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("multiply", [newExp(null, [[-1, 0]]), newExp("sin", [arg]), diffArg])
  },

  tan: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("multiply", [newExp("sec", [arg]), newExp("sec", [arg]), diffArg])
  },

  csc: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("multiply", [
      newExp(null, [[-1, 0]]),
      newExp("csc", [arg]),
      newExp("cot", [arg]),
      diffArg,
    ])
  },

  sec: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("multiply", [newExp("sec", [arg]), newExp("tan", [arg]), diffArg])
  },

  cot: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("multiply", [
      newExp(null, [[-1, 0]]),
      newExp("csc", [arg]),
      newExp("csc", [arg]),
      diffArg,
    ])
  },

  arcsin: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("divide", [
      diffArg,
      newExp("sqrt", [
        newExp("subtract", [newExp(null, [[1, 0]]), newExp("multiply", [arg, arg])]),
      ]),
    ])
  },

  arccos: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("divide", [
      newExp("multiply", [newExp(null, [[-1, 0]]), diffArg]),
      newExp("sqrt", [
        newExp("subtract", [newExp(null, [[1, 0]]), newExp("multiply", [arg, arg])]),
      ]),
    ])
  },

  arctan: ({ args: [arg] }, variable, implicit) => {
    const diffArg = diff(arg, variable, implicit)
    return newExp("divide", [
      diffArg,
      newExp("add", [newExp(null, [[1, 0]]), newExp("multiply", [arg, arg])]),
    ])
  },
}
