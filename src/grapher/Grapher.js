import React, { useRef, useReducer, useState, useEffect } from "react"
import Panels from "../components/Panels"
import { MathJax } from "better-react-mathjax"
import { parseInput } from "../utils/shared/Parsing.mjs"
import createTree from "../utils/tree/CreateTree.mjs"
import display from "../utils/shared/Display.mjs"
import "./Grapher.css"

const functionReducer = (userFunctions, { type, payload }) => {
  switch (type) {
    case "submit":
      return [...userFunctions, payload.userInput]
    case "edit": {
      userFunctions[payload.index] = payload.userInput
      return userFunctions
    }
    case "delete":
      return userFunctions.remove(payload.index)
    case "clear": {
      return []
    }
  }
}

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
  }
}

export default function Grapher() {
  const panelsConfig = {
    percentage: 200 / 3,
    minRatio: 50,
    maxRatio: 80,
    alwaysShowFirst: true,
    autoRotate: true,
  }
  const canvasRef = useRef(null)
  const inputRef = useRef(null)
  const [userFunctions, dispatchFunction] = useReducer(functionReducer, [])
  const [displayFunctions, dispatchDisplay] = useReducer(displayReducer, [])
  const [userInput, setUserInput] = useState("")
  const [displayError, setDisplayError] = useState(null)
  const [selectedFunction, setSelectedFunction] = useState(0)

  const handleChange = ({ target }) => {
    setDisplayError(null)
    setUserInput(target.value)
    try {
      const tree = createTree(parseInput(target.value))
      dispatchDisplay({
        type: "edit",
        payload: { tree, index: selectedFunction },
      })
    } catch (error) {
      setDisplayError(error)
    }
  }

  const editFunction = (index) => {
    setSelectedFunction(index)
    setUserInput(userFunctions[index])
  }

  const deleteFunction = (index) => {
    setSelectedFunction(userFunctions.length - 1)
    setUserInput("")
    dispatchFunction({ type: "delete", payload: { index } })
    dispatchDisplay({ type: "delete", payload: { index } })
  }

  const clearAll = () => {
    if (window.confirm("Clear all functions?")) {
      setUserInput("")
      setSelectedFunction(0)
      dispatchFunction({ type: "clear" })
      dispatchDisplay({ type: "clear" })
    }
  }

  const keyEvents = {
    Enter: () => {
      try {
        const tree = createTree(parseInput(userInput))
        if (tree.isNumber() || tree.evaluate().isFunctionOf("x", true)) {
          if (selectedFunction === userFunctions.length) {
            dispatchFunction({ type: "submit", payload: { userInput } })
            dispatchDisplay({ type: "add-blank" })
            setSelectedFunction((current) => ++current)
          } else {
            dispatchFunction({ type: "edit", payload: { userInput, index: selectedFunction } })
            setSelectedFunction(userFunctions.length)
          }
          setUserInput("")
        } else {
          setDisplayError({ message: "Must be a function of only x." })
        }
      } catch (error) {
        setDisplayError(error)
      }
    },

    ArrowUp: () => {
      if (userFunctions[selectedFunction - 1]) {
        setUserInput(userFunctions[selectedFunction - 1])
        setSelectedFunction((current) => --current)
      }
    },

    ArrowDown: () => {
      if (displayFunctions[selectedFunction]) {
        setUserInput(userFunctions[selectedFunction + 1] || "")
        setSelectedFunction((current) => ++current)
      }
    },

    Escape: () => {
      if (selectedFunction !== userFunctions.length) {
        const tree = createTree(parseInput(userFunctions[selectedFunction]))
        dispatchDisplay({
          type: "edit",
          payload: { tree, index: selectedFunction },
        })
        setSelectedFunction(userFunctions.length)
      } else {
        const tree = createTree(parseInput(""))
        dispatchDisplay({
          type: "edit",
          payload: { tree, index: selectedFunction },
        })
      }
      setDisplayError(null)
      setUserInput("")
    },
  }

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d")
  })

  useEffect(() => {
    setTimeout(() => dispatchDisplay({ type: "add-blank" }), 100)
  }, [])

  return (
    <div className="grapher-container">
      <Panels config={panelsConfig}>
        <div className="canvas-container">
          <canvas ref={canvasRef} />
        </div>
        <div className="user-functions-container">
          <div className="menu-right">
            <div onClick={clearAll} className="clear">
              <img src="/assets/icons/trash.svg" alt="clear" width="24" height="24" />
            </div>
          </div>
          <div className="user-functions-list">
            {displayFunctions.map((displayFunction, i) => (
              <div
                key={i}
                style={selectedFunction === i ? { color: "grey",border:"none" } : null}
                className="user-function-item"
              >
                <div className="overflow-hidden">
                  <MathJax inline dynamic>
                    {`$f_{${i + 1}}=${displayFunction}$`}
                  </MathJax>
                </div>
                <div className="buttons">
                  <div onClick={() => editFunction(i)} className="edit">
                    <img src="/assets/icons/pencil.svg" alt="edit" width="24" height="24" />
                  </div>
                  <div onClick={() => deleteFunction(i)} className="delete">
                    <img src="/assets/icons/cross.svg" alt="delete" width="24" height="24" />
                  </div>
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
      </Panels>
    </div>
  )
}
