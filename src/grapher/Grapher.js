import React from "react"
import Panels from "../components/Panels"

export default function Grapher() {
  return (
    <Panels percentage={25} minRatio={20} maxRatio={50} alwaysShowSecond>
      <Panels vertical percentage={50} minRatio={20} maxRatio={80} alwaysShowFirst alwaysShowSecond>
        <div style={{ backgroundColor: "orange" }} className="flex-fill-container">
          123
        </div>
        <div style={{ backgroundColor: "green" }} className="flex-fill-container">
          123
        </div>
      </Panels>
      <div style={{ backgroundColor: "lightgrey" }} className="flex-fill-container">
        123
      </div>
    </Panels>
  )
}
