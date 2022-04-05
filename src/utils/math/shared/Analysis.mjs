import Expression from "../tree/Expression.mjs"

import { diff } from "../functions/Symbolic.mjs"
import { parseInput } from "./Parsing.mjs"
import createTree from "../tree/CreateTree.mjs"

const newExp = (op, args) => {
  if (!op) return new Expression(null, args)
  return new Expression(functions[op], args)
}

export function newtonsMethod(tree, value) {
  const func = (x) => tree.evaluate({}, "x", [x, 0])[0]
  const deriv = (x) => diff(tree, newExp(null, ["x"])).evaluate({}, "x", [x, 0])[0]
  let root = value
  let i = 0
  try {
    let next = root - func(root) / deriv(root)
    while (root !== next && i < 100) {
      if (!deriv(root)) return NaN
      root = next
      next = next - func(next) / deriv(next)
      i++
    }
  } catch {
    return NaN
  }
  if (i === 50) return NaN
  return root
}

const userInput = "x^(1/3)"
console.log(newtonsMethod(createTree(parseInput(userInput)), 100))
