import { DomainError } from "../shared/Errors.mjs"
import Expression from "../tree/Expression.mjs"
import differentiate from "../shared/Differentiation.mjs"
import simplify from "../shared/Simplification.mjs"
import * as functions from "./Complex.mjs"

const newExp = (op, args) => {
  if (!op) return new Expression(null, args)
  return new Expression(functions[op], args)
}

const newC = (c) => newExp(null, [c])

export function diff(treeA, treeB, partial = false) {
  if (!treeB) return simplify(differentiate(treeA))
  if (treeB.isNumber()) throw new DomainError("Cannot differentiate with respect to a constant.")
  return simplify(
    newExp("divide", [
      simplify(differentiate(treeA)),
      simplify(differentiate(treeB)),
    ])
  )
}
