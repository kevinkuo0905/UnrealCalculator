import createTree from "../tree/CreateTree.mjs"
import { parseInput } from "../shared/Parsing.mjs"
import diff from "./Differentiation.mjs"

export function derive(tree, variable) {
  return diff(tree, variable)
}

