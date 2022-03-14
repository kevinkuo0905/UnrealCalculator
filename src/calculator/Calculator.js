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
  const [inputHistory, setInputHistory] = useState([])
  const [currentItem, setCurrentItem] = useState(-1)

  const keyEvents = {
    Enter: () => {
      if (!outputError && userInput.trim()) {
        const renderedOutput = outputRef.current.cloneNode(true)
        outputRef.current.style.transition = "none"
        renderedOutput.classList.remove("preview")
        containerRef.current.appendChild(renderedOutput)
        renderedOutput.scrollIntoView()
        inputRef.current.focus()
        setInputHistory([userInput, ...inputHistory])
        setUserInput("")
        setCurrentItem(-1)
      } else {
        if (!userInput.trim()) {
          setUserInput("")
          inputRef.current.placeholder = "Enter something..."
          setTimeout(() => (inputRef.current.placeholder = "Input"), 2000)
        }
        if (!inputError && userInput.trim()) setOutput(`${outputError.message}`)
      }
    },

    ArrowUp: () => {
      if (inputHistory[currentItem + 1]) {
        setUserInput(inputHistory[currentItem + 1])
        setCurrentItem((current) => ++current)
      }
    },

    ArrowDown: () => {
      if (inputHistory[currentItem - 1]) {
        setUserInput(inputHistory[currentItem - 1])
        setCurrentItem((current) => --current)
      }
    },

    Escape: () => {
      setUserInput("")
    },
  }

  useLayoutEffect(() => {
    outputRef.current.style.transition = "none"
    if (!userInput.trim()) {
      outputRef.current.classList.add("hidden")
      setCurrentItem(-1)
    } else {
      outputRef.current.style.transition = ""
      outputRef.current.classList.remove("hidden")
      containerRef.current.scrollTo(0, 500)
      try {
        const tree = createTree(parseInput(userInput))
        if (display(tree) === "") {
          setDisplayInput(" ")
        } else {
          setDisplayInput(display(tree))
        }
        setInputError(null)
      } catch (error) {
        setDisplayInput(userInput)
        setInputError(error)
      }
      try {
        const tree = createTree(parseInput(userInput))
        setOutput(display(tree.evaluate()))
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
          onKeyDown={({ key }) => keyEvents[key] && keyEvents[key]()}
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
        <div onClick={keyEvents["Enter"]} className="return">
          <img src="/assets/icons/arrow-return-left.svg" alt="return" width="24" height="24" />
        </div>
      </div>
      <div ref={outputRef} className="output preview">
        <MathJax inline dynamic>
          {inputError ? `$\\small{\\textrm{${inputError.message} }}$` : `$${displayInput}$`}
        </MathJax>
        <MathJax inline dynamic>
          {outputError ? `$\\small{\\textrm{${output} }}$` : `$${output}$`}
        </MathJax>
      </div>
      <div ref={containerRef} className="output-container" />
    </div>
  )
}
