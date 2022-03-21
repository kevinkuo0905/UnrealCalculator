import React, { useRef, useState, useLayoutEffect, useEffect } from "react"
import { MathJax } from "better-react-mathjax"
import { parseInput } from "../utils/math/shared/Parsing.mjs"
import createTree from "../utils/math/tree/CreateTree.mjs"
import display from "../utils/math/shared/Display.mjs"
import { examples } from "../examples/Examples.js"
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
  const [sample, setSample] = useState([])

  const clearAll = () => {
    if (window.confirm("Clear all calculations and history?")) {
      setUserInput("")
      containerRef.current.textContent = ""
      setInputHistory([])
    }
  }

  const keyEvents = {
    Enter: () => {
      if (!outputError && userInput.trim()) {
        const renderedOutput = outputRef.current.cloneNode(true)
        outputRef.current.style.transition = "none"
        renderedOutput.classList.remove("preview")
        containerRef.current.appendChild(renderedOutput)
        inputRef.current.focus()
        setInputHistory([userInput, ...inputHistory])
        setUserInput("")
        setCurrentItem(-1)
      } else {
        if (!userInput.trim()) {
          setUserInput("")
          inputRef.current.placeholder = "Enter something..."
          setTimeout(() => (inputRef.current.placeholder = "Input"), 1500)
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
      } else {
        setUserInput("")
        setCurrentItem(-1)
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
        setOutput(display(tree.evaluate()))
        setOutputError(null)
      } catch (error) {
        setOutput("")
        setOutputError(error)
      }
    }
    const current = containerRef.current.lastChild
    if (current) current.scrollIntoView()
  }, [userInput])

  useEffect(() => {
    setTimeout(() => {
      setSample([
        <div key={-1} className="output">
          Examples:
        </div>,
        ...examples.inputHistory.map((input, i, array) => {
          const tree = createTree(parseInput(array[array.length - 1 - i]))
          return (
            <div key={i} className="output">
              <MathJax inline dynamic>{`$${display(tree)}$`}</MathJax>
              <MathJax inline dynamic>{`$${display(tree.evaluate())}$`}</MathJax>
            </div>
          )
        }),
      ])
    }, 400)
    setInputHistory(examples.inputHistory)
  }, [])

  return (
    <div className="calculator-container">
      <div className="menu-left">
        <div onClick={clearAll} className="clear">
          <img src="/assets/icons/trash.svg" alt="clear" width="24" height="24" />
        </div>
      </div>
      <div ref={containerRef} className="output-container">
        {sample}
      </div>
      <div ref={outputRef} className="output preview">
        <MathJax inline dynamic>
          {inputError ? `$\\small{\\textrm{${inputError.message} }}$` : `$${displayInput}$`}
        </MathJax>
        <MathJax inline dynamic>
          {outputError ? `$\\small{\\textrm{${output} }}$` : `$${output}$`}
        </MathJax>
      </div>
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
    </div>
  )
}
