import React from "react"
import Panels from "../components/Panels"
import "./Grapher.css"

export default function Grapher() {
  const panelsConfig = {
    percentage: 75,
    minRatio: 50,
    maxRatio: 80,
    alwaysShowFirst: true,
    autoRotate: true,
  }


  return (
    <div className="flex-fill-container">
      <Panels config={panelsConfig}>
        <div style={{ backgroundColor: "orange" }} className="flex-fill-container">

        </div>
        <div style={{ backgroundColor: "lightgrey" }} className="flex-fill-container">

        </div>
      </Panels>
    </div>
  )
}
