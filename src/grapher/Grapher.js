import React from "react"
import Panels from "../components/Panels.js"
import Graph from "./Graph.js"
import FunctionsList from "./FunctionsList.js"
import "./Grapher.css"

export default function Grapher({ userFunctions, functionDispatcher }) {
  const panelsConfig = {
    percentage: 200 / 3,
    minRatio: 50,
    maxRatio: 80,
    alwaysShowFirst: true,
    autoRotate: true,
  }

  return (
    <div className="grapher-container">
      <Panels config={panelsConfig}>
        <Graph userFunctions={userFunctions} />
        <FunctionsList userFunctions={userFunctions} functionDispatcher={functionDispatcher} />
      </Panels>
    </div>
  )
}
