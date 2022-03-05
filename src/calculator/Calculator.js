import React, { useState, useEffect } from "react"
import { MathJax } from "better-react-mathjax"
import { parseInput } from "../utils/shared/Parsing.mjs"
import createTree from "../utils/tree/CreateTree.mjs"
import { displayComplex } from "../utils/shared/Parsing.mjs"
import "./Calculator.css"

export default function Calculator() {
  const [userInput, setUserInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState({ name: null, message: null })

  useEffect(() => {
    try {
      setOutput(displayComplex(createTree(parseInput(userInput)).evaluate()))
      setError({ name: null, message: null })
    } catch (e) {
      if (e) setError(e)
    }
  }, [userInput])

  return (
    <>
      <div style={{ backgroundColor: "cyan" }} className="flex-fill-container">
        <div className="output">
          <MathJax className="mx-3" inline dynamic>{`$${userInput}$`}</MathJax>
          <MathJax inline dynamic>{`$${output}$`}</MathJax>
        </div>
        <input
          onChange={({ target }) => setUserInput(target.value)}
          type="text"
          id="user-input"
          name="user-input"
          spellCheck="false"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </>
  )
}
