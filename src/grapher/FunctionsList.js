import React, { useRef, useReducer, useState, useEffect } from "react"
import { MathJax } from "better-react-mathjax"
import { examples } from "../examples/Examples.js"
import { parseInput } from "../utils/math/shared/Parsing.mjs"
import createTree from "../utils/math/tree/CreateTree.mjs"
import display from "../utils/math/shared/Display.mjs"

const displayReducer = (displayFunctions, { type, payload }) => {
  switch (type) {
    case "add-blank":
      return [...displayFunctions, ""]
    case "edit": {
      displayFunctions[payload.index] = display(payload.tree)
      return displayFunctions
    }
    case "delete":
      return displayFunctions.remove(payload.index)
    case "clear":
      return [""]
    case "examples":
      return payload.examples
    default:
      throw new Error("bad action")
  }
}

export default function FunctionsList({ userFunctions, functionDispatcher }) {
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [displayFunctions, displayDispatcher] = useReducer(displayReducer, [])
  const [userInput, setUserInput] = useState("")
  const [displayError, setDisplayError] = useState(null)
  const [selectedFunction, setSelectedFunction] = useState(0)

  const handleChange = ({ target }) => {
    setDisplayError(null)
    setUserInput(target.value)
    try {
      const tree = createTree(parseInput(target.value))
      displayDispatcher({
        type: "edit",
        payload: { tree, index: selectedFunction },
      })
    } catch (error) {
      setDisplayError(error)
    }
  }

  const editFunction = (index) => {
    if (selectedFunction === userFunctions.length) {
      setUserInput(userFunctions[index] || "")
      setSelectedFunction(index)
    } else if (selectedFunction !== index) {
      try {
        const tree = createTree(parseInput(userInput))
        if (tree.isNumber() || tree.evaluate().isFunctionOf("x", true)) {
          functionDispatcher({ type: "edit", payload: { userInput, index: selectedFunction } })
          setUserInput(userFunctions[index] || "")
          setSelectedFunction(index)
        } else {
          setDisplayError({ message: "Must be a constant or function of x only." })
        }
      } catch (error) {
        setDisplayError(error)
      }
    }
    inputRef.current.focus()
  }

  const deleteFunction = (event, index) => {
    event.stopPropagation()
    functionDispatcher({ type: "delete", payload: { index } })
    displayDispatcher({ type: "delete", payload: { index } })
    setUserInput("")
    setSelectedFunction(userFunctions.length - 1)
    setDisplayError(null)
  }

  const clearAll = () => {
    if (window.confirm("Clear all functions?")) {
      functionDispatcher({ type: "clear" })
      displayDispatcher({ type: "clear" })
      setUserInput("")
      setSelectedFunction(0)
      setDisplayError(null)
    }
  }

  const keyEvents = {
    Enter: () => {
      if (!userInput.trim()) {
        setUserInput("")
        inputRef.current.placeholder = "Enter something..."
        setTimeout(() => (inputRef.current.placeholder = "Input"), 1500)
      } else {
        try {
          const tree = createTree(parseInput(userInput))
          if (tree.isNumber() || tree.evaluate().isFunctionOf("x", true)) {
            if (selectedFunction === userFunctions.length) {
              functionDispatcher({ type: "submit", payload: { userInput } })
              displayDispatcher({ type: "add-blank" })
              setSelectedFunction((current) => ++current)
            } else {
              functionDispatcher({ type: "edit", payload: { userInput, index: selectedFunction } })
              setSelectedFunction(userFunctions.length)
            }
            setUserInput("")
          } else {
            setDisplayError({ message: "Must be a constant or function of x only." })
          }
        } catch (error) {
          setDisplayError(error)
        }
      }
    },

    ArrowUp: () => {
      if (userFunctions[selectedFunction - 1]) {
        if (selectedFunction === userFunctions.length) {
          setUserInput(userFunctions[selectedFunction - 1])
          setSelectedFunction((current) => --current)
        } else {
          try {
            const tree = createTree(parseInput(userInput))
            if (tree.isNumber() || tree.evaluate().isFunctionOf("x", true)) {
              functionDispatcher({ type: "edit", payload: { userInput, index: selectedFunction } })
              setUserInput(userFunctions[selectedFunction - 1])
              setSelectedFunction((current) => --current)
            } else {
              setDisplayError({ message: "Must be a constant or function of x only." })
            }
          } catch (error) {
            setDisplayError(error)
          }
        }
      }
    },

    ArrowDown: () => {
      if (displayFunctions[selectedFunction]) {
        if (selectedFunction === userFunctions.length) {
          setUserInput(userFunctions[selectedFunction + 1] || "")
          setSelectedFunction((current) => ++current)
        } else {
          try {
            const tree = createTree(parseInput(userInput))
            if (tree.isNumber() || tree.evaluate().isFunctionOf("x", true)) {
              functionDispatcher({ type: "edit", payload: { userInput, index: selectedFunction } })
              setUserInput(userFunctions[selectedFunction + 1] || "")
              setSelectedFunction((current) => ++current)
            } else {
              setDisplayError({ message: "Must be a constant or function of x only." })
            }
          } catch (error) {
            setDisplayError(error)
          }
        }
      }
    },

    Escape: () => {
      if (selectedFunction !== userFunctions.length) {
        const tree = createTree(parseInput(userFunctions[selectedFunction]))
        displayDispatcher({
          type: "edit",
          payload: { tree, index: selectedFunction },
        })
        setSelectedFunction(userFunctions.length)
      } else {
        const tree = createTree(parseInput(""))
        displayDispatcher({
          type: "edit",
          payload: { tree, index: selectedFunction },
        })
      }
      setDisplayError(null)
      setUserInput("")
    },
  }

  useEffect(() => {
    setTimeout(() => displayDispatcher({ type: "add-blank" }), 100)
  }, [])

  useEffect(() => {
    const selected = listRef.current.children.item(selectedFunction)
    if (selected) {
      selected.scrollIntoView()
    }
  }, [selectedFunction])

  useEffect(() => {
    setTimeout(() => {
      displayDispatcher({ type: "examples", payload: { examples: examples.displayFunctions } })
      functionDispatcher({ type: "examples", payload: { examples: examples.userFunctions } })
      displayDispatcher({ type: "add-blank" })
      setSelectedFunction(examples.userFunctions.length)
    }, 200)
  }, [functionDispatcher])

  return (
    <div className="user-functions-container">
      <div className="menu-right">
        <div onClick={clearAll} className="clear">
          <img src="/assets/icons/trash.svg" alt="clear" width="24" height="24" />
        </div>
      </div>
      <div ref={listRef} className="user-functions-list">
        {displayFunctions.map((displayFunction, i) => (
          <div
            key={i}
            onClick={() => editFunction(i)}
            style={
              selectedFunction === i && userFunctions.length !== i
                ? { border: "1px solid black", color: "blue" }
                : null
            }
            className="user-function-item"
          >
            <div className="overflow-hidden">
              <MathJax inline dynamic>
                {`$f_{${i + 1}}=${displayFunction}$`}
              </MathJax>
            </div>
            <div onClick={(event) => deleteFunction(event, i)} className="delete">
              <img src="/assets/icons/cross.svg" alt="delete" width="24" height="24" />
            </div>
          </div>
        ))}
      </div>
      <div className="error-message">
        <MathJax inline dynamic>
          {displayError ? `$\\small{\\textrm{${displayError.message} }}$` : null}
        </MathJax>
      </div>
      <div className="input-box">
        <input
          ref={inputRef}
          onChange={handleChange}
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
