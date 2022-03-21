import React, { useState, useReducer } from "react"
import Graph from "../grapher/Graph"
import Header from "./Header"
import Panels from "./Panels"
import Calculator from "../calculator/Calculator"
import Grapher from "../grapher/Grapher"
import Keyboard from "./Keyboard"
import "./Main.css"

const functionReducer = (userFunctions, { type, payload }) => {
  switch (type) {
    case "submit":
      return [...userFunctions, payload.userInput]
    case "edit": {
      userFunctions[payload.index] = payload.userInput
      return ["", ...userFunctions].slice(1)
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

export default function Main() {
  const panelsConfig = {
    ids: ["calculator", "grapher"],
    onePanelOnlyMaxDimens: 960,
    onePanelDefault: 1,
    percentage: 25,
    minRatio: 20,
    maxRatio: 50,
  }

  const [userFunctions, functionDispatcher] = useReducer(functionReducer, [])

  return (
    <main>
      <Header />
      <Panels config={panelsConfig}>
        <Calculator userFunctions={userFunctions} />
        <Grapher userFunctions={userFunctions} functionDispatcher={functionDispatcher} />
      </Panels>
      <Keyboard />
    </main>
  )
}
