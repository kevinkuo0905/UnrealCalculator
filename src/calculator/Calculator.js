import React, { useRef, useState, useLayoutEffect } from "react"
import { MathJax } from "better-react-mathjax"
import { parseInput, displayComplex } from "../utils/shared/Parsing.mjs"
import createTree from "../utils/tree/CreateTree.mjs"
import { round } from "../utils/functions/Complex.mjs"
import "./Calculator.css"

export default function Calculator() {
  const outputRef = useRef(null)
  const containerRef = useRef(null)
  const [userInput, setUserInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState({ name: null, message: null })

  const onClick = () => {
    if (!error.name) {
      const renderedOutput = outputRef.current.cloneNode(true)
      outputRef.current.style.transition = "none"
      renderedOutput.classList.remove("preview")
      containerRef.current.appendChild(renderedOutput)
      renderedOutput.scrollIntoView()
      setUserInput("")
    } else {
      setOutput(`${error.message}`)
    }
  }

  useLayoutEffect(() => {
    if (!userInput) {
      outputRef.current.classList.add("hidden")
      setOutput("")
    } else {
      outputRef.current.style.transition = ""
      outputRef.current.classList.remove("hidden")
      try {
        const result = createTree(parseInput(userInput)).evaluate()
        console.log(result.toString())
        if (Array.isArray(result)) {
          setOutput(displayComplex(round(result, 10)))
        } else {
          setOutput(result.toString())
        }
        setError({ name: null, message: null })
      } catch (err) {
        if (err) {
          setOutput("")
          setError(err)
        }
      }
    }
  }, [userInput])

  return (
    <div className="calculator-container">
      <div className="input-box">
        <input
          onChange={({ target }) => setUserInput(target.value)}
          onKeyUp={({ keyCode }) => {
            if (keyCode === 13) onClick()
          }}
          type="text"
          id="user-input"
          name="user-input"
          placeholder="Input"
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
        <MathJax inline dynamic>{`$${userInput}$`}</MathJax>
        <MathJax inline dynamic>
          {error.name ? `${output}` : `$${output}$`}
        </MathJax>
      </div>
      <div ref={containerRef} className="output-container" />
    </div>
  )
}
