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
    percentage: 30,
    minRatio: 20,
    maxRatio: 50,
  }

  return (
    <main>
      <Panels config={panelsConfig}>
        <Calculator />
        <Grapher />
      </Panels>
    </main>
  )
}
