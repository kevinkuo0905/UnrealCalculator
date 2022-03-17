import React from "react"
import Panels from "./Panels"
import Grapher from "../grapher/Grapher"
import Calculator from "../calculator/Calculator"
import Keyboard from "./Keyboard"
import "./Main.css"

export default function Main() {
  const panelsConfig = {
    ids: ["calculator", "grapher"],
    onePanelOnlyMaxDimens: 960,
    onePanelDefault: 1,
    percentage: 25,
    minRatio: 20,
    maxRatio: 50,
  }

  return (
    <main>
      <Panels config={panelsConfig}>
        <Calculator />
        <Grapher />
      </Panels>
      <Keyboard />
    </main>
  )
}
