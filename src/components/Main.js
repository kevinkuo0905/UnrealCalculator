import React from "react"
import Panels from "./Panels"
import Grapher from "../grapher/Grapher"
import Calculator from "../calculator/Calculator"
import "./Main.css"

export default function Main() {
  const panelsConfig = {
    ids: ["calculator", "grapher"],
    onePanelOnlyMaxDimens: 960,
    onePanelDefault: 1,
    percentage: 35,
    minRatio: 25,
    maxRatio: 45,
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
