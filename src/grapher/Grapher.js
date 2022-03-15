import React, { useRef, useState, useEffect } from "react"
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
  const canvasRef = useRef(null)
  const [userFunctions, setUserFunctions] = useState([])
  const [displayFunctions, setDisplayFunctions] = useState([])

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d")
  }, [])

  return (
    <div className="flex-fill-container">
      <Panels config={panelsConfig}>
        <div className="flex-fill-container">
          <canvas ref={canvasRef} />
        </div>
        <div className="flex-fill-container">
          </div>
      </Panels>
    </div>
  )
}
