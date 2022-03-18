import React, { useReducer } from "react"
import Panels from "../components/Panels"
import Graph from "./Graph"
import FunctionsList from "./FunctionsList"
import "./Grapher.css"

const functionReducer = (userFunctions, { type, payload }) => {
  switch (type) {
    case "submit":
      return [...userFunctions, payload.userInput]
    case "edit": {
      userFunctions[payload.index] = payload.userInput
      return [, ...userFunctions].slice(1)
    }
    case "delete":
      return userFunctions.remove(payload.index)
    case "clear":
      return []
    case "examples":
      return payload.examples
    default:
      throw new Error("bad action")
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

  const [userFunctions, functionDispatcher] = useReducer(functionReducer, [])

  return (
    <div className="grapher-container">
      <Panels config={panelsConfig}>
        <Graph userFunctions={userFunctions} />
        <FunctionsList userFunctions={userFunctions} functionDispatcher={functionDispatcher} />
      </Panels>
    </div>
  )
}
