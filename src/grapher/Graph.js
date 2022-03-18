import React, { useRef, useEffect } from "react"
import { parseInput } from "../utils/shared/Parsing.mjs"
import createTree from "../utils/tree/CreateTree.mjs"
import display from "../utils/shared/Display.mjs"

export default function Graph({ userFunctions }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const trees = userFunctions.map((func) => {
      return (x) => createTree(parseInput(func)).evaluate({}, "x", [x, 0])
    })

    const canvas = canvasRef.current
    const canvasWidth = canvas.clientWidth
    const canvasHeight = canvas.clientHeight
    const aspectRatio = canvasWidth / canvasHeight

    canvas.setAttribute("width", `${canvasWidth}`)
    canvas.setAttribute("height", `${canvasHeight}`)
    const context = canvas.getContext("2d")

    context.beginPath()
    context.strokeStyle = "grey"
    context.moveTo(0, canvasHeight / 2)
    context.lineTo(canvasWidth, canvasHeight / 2)
    context.moveTo(canvasWidth / 2, 0)
    context.lineTo(canvasWidth / 2, canvasHeight)
    context.stroke()

    let percentX, percentY, funcX, funcY, pixelX, pixelY
    const xMin = -5
    const xMax = 5
    const yMin = -5 / aspectRatio
    const yMax = 5 / aspectRatio

    if (trees) {
      trees.forEach((tree) => {
        context.beginPath()
        context.strokeStyle = "black"
        context.lineWidth = 2
        const n = 2 * canvasWidth
        for (let i = 1; i < n; i++) {
          try {
            percentX = i / n
            funcX = percentX * (xMax - xMin) + xMin
            funcY = tree(funcX)[0]
            percentY = (funcY - yMin) / (yMax - yMin)
            pixelX = percentX * canvas.width
            pixelY = canvas.height * (1 - percentY)
            context.lineTo(pixelX, pixelY)
          } catch {}
        }
        context.stroke()
      })
    }
  }, [userFunctions])

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  )
}
