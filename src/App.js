import React, { useState, useEffect } from "react"
import { parseInput } from "./utils/shared/Parsing.mjs"
import createTree from "./utils/tree/CreateTree.mjs"
import diff from "./utils/special-functions/Differentiation.mjs"

function App() {
  const [userInput, setUserInput] = useState("x^2")
  const [output, setOutput] = useState("")
  const [error, setError] = useState({ name: null, message: null })
  useEffect(() => {
    try {
      setOutput(createTree(parseInput(userInput)).evaluate().toString())
      setError({ name: null, message: null })
    } catch (e) {
      if (e) setError(e)
    }
  }, [userInput])

  return (
    <main>
      <input
        onChange={({ target }) => setUserInput(target.value)}
        type="text"
        id="user-input"
        name="user-input"
        value={userInput}
      />

      <p>{output}</p>
      <p>{error.name ? `${error.name}: ${error.message}` : null}</p>
    </main>
  )
}

export default App
