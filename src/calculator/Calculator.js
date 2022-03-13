import React, { useRef, useState, useLayoutEffect } from "react"
import { MathJax } from "better-react-mathjax"
import { parseInput } from "../utils/shared/Parsing.mjs"
import createTree from "../utils/tree/CreateTree.mjs"
import display from "../utils/shared/Display.mjs"
import "./Calculator.css"

export default function Calculator() {
  const inputRef = useRef(null)
  const outputRef = useRef(null)
  const containerRef = useRef(null)
  const [userInput, setUserInput] = useState("")
  const [displayInput, setDisplayInput] = useState("")
  const [output, setOutput] = useState("")
  const [inputError, setInputError] = useState(null)
  const [outputError, setOutputError] = useState(null)

  const onClick = () => {
    if (!outputError && userInput.trim()) {
      const renderedOutput = outputRef.current.cloneNode(true)
      outputRef.current.style.transition = "none"
      renderedOutput.classList.remove("preview")
      containerRef.current.appendChild(renderedOutput)
      renderedOutput.scrollIntoView()
      setUserInput("")
    } else {
      if (!(inputError instanceof SyntaxError)) setOutput(`${outputError.message}`)
      if (!userInput.trim()) {
        setUserInput("")
        inputRef.current.placeholder = "Enter something..."
        setTimeout(() => (inputRef.current.placeholder = "Input"), 2000)
      }
    }
  }

  useLayoutEffect(() => {
    outputRef.current.style.transition = "none"
    if (!userInput.trim()) {
      outputRef.current.classList.add("hidden")
      setOutput(" ")
    } else {
      outputRef.current.style.transition = ""
      outputRef.current.classList.remove("hidden")
      try {
        const tree = createTree(parseInput(userInput))
        setDisplayInput(display(tree))
        setInputError(null)
      } catch (error) {
        setDisplayInput(userInput)
        setInputError(error)
      }
      try {
        const tree = createTree(parseInput(userInput))
        setOutput(display(tree.evaluate(), 15))
        setOutputError(null)
      } catch (error) {
        setOutput("")
        setOutputError(error)
      }
    }
  }, [userInput])

  return (
    <div className="calculator-container">
      <div className="input-box">
        <input
          ref={inputRef}
          onChange={({ target }) => setUserInput(target.value)}
          onKeyUp={({ key }) => {
            if (key === "Enter") onClick()
          }}
          type="text"
          id="user-input"
          name="user-input"
          placeholder="Input"
          autoFocus
          spellCheck="false"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          value={userInput}
        />
        <div onClick={onClick} className="return">
          <img src="/assets/icons/arrow-return-left.svg" alt="return" width="24" height="24" />
        </div>
      </div>
      <div ref={outputRef} className="output preview">
        <MathJax inline dynamic>
          {inputError instanceof SyntaxError ? `${inputError.message}` : `$${displayInput}$`}
        </MathJax>
        <MathJax inline dynamic>
          {outputError ? `${output}` : `$${output}$`}
        </MathJax>
      </div>
      <div ref={containerRef} className="output-container" />
    </div>
  )
}
