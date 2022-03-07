import React from "react"
import Panels from "./Panels"
import Grapher from "../grapher/Grapher"
import Calculator from "../calculator/Calculator"
import "./Main.css"

export default function Main() {
  const panelsConfig = {
    ids: ["grapher", "calculator"],
    onePanelOnlyMaxDimens: 720,
    onePanelDefault: 2,
    percentage: 70,
    minRatio: 50,
    maxRatio: 80,
  }

  return (
    <main>
      <Panels config={panelsConfig}>
        <Grapher />
        <Calculator />
      </Panels>
    </main>
  )
}
