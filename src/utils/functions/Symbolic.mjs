import createTree from "../tree/CreateTree.mjs"
import { parseInput } from "../shared/Parsing.mjs"
import differentiate from "../shared/Differentiation.mjs"
import simplify from "../shared/Simplification.mjs"

export function diff(treeA,treeB) {

  return simplify(differentiate(treeA), { factor: true })
}

const userInput = "x/(x^2-1)"
console.log(parseInput(userInput))
console.log(diff(createTree(parseInput(userInput))).toString())
