import React, { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useResizeObserver } from "../utils/UseResizeObserver.js"
import { MathJax } from "better-react-mathjax"
import { parseInput } from "../utils/math/shared/Parsing.mjs"
import createTree from "../utils/math/tree/CreateTree.mjs"
import { diff } from "../utils/math/functions/Symbolic.mjs"

const generateBezier = (
  xMin,
  xMax,
  yMin,
  yMax,
  canvasWidth,
  canvasHeight,
  n,
  userFunction,
  derivative
) => {
  const xCoordinates = []
  const yCoordinates = []
  const slopes = []
  const xBeziers1 = []
  const yBeziers1 = []
  const xBeziers2 = []
  const yBeziers2 = []
  const result = []

  const domain = xMax - xMin
  const range = yMax - yMin
  const dx = domain / n
  const thirds = dx / 3

  for (let i = 0; i <= n; i++) {
    const xCoordinate = xMin + i * dx
    xCoordinates.push(xCoordinate)
    xBeziers1.push(xCoordinate + thirds)
    xBeziers2.push(xCoordinate - thirds)
    yCoordinates.push(userFunction(xCoordinate))

    slopes.push(derivative(xCoordinate))
    yBeziers1.push(yCoordinates[i] + slopes[i] * thirds)
    yBeziers2.push(yCoordinates[i] - slopes[i] * thirds)
  }
  const toCanvas = (x, y) => {
    const xConversion = canvasWidth / domain
    const yConversion = canvasHeight / range
    return [(x - xMin) * xConversion, canvasHeight - (y - yMin) * yConversion]
  }
  const startingPoint = toCanvas(xCoordinates[0], yCoordinates[0])
  for (let i = 0; i < n; i++) {
    result.push([
      ...toCanvas(xBeziers1[i], yBeziers1[i]),
      ...toCanvas(xBeziers2[i + 1], yBeziers2[i + 1]),
      ...toCanvas(xCoordinates[i + 1], yCoordinates[i + 1]),
    ])
  }
  return { startingPoint, result }
}

export default function Graph({ userFunctions }) {
  const initialWindow = { xMin: -5, xMax: 5 }
  const [canvasDimens, setCanvasDimens] = useState(initialWindow)
  const canvasRef = useRef(null)
  const settingsRef = useRef(null)
  const canvasBounds = useResizeObserver(canvasRef)

  const toggleSettings = () => {
    const settings = settingsRef.current
    if (settings.style.display === "block") {
      settings.style.display = "none"
    } else {
      settings.style.display = "block"
    }
  }

  const handleChange = ({ target }) => {
    setCanvasDimens({ ...canvasDimens, [target.id]: target.value })
  }

  useLayoutEffect(() => {
    const validDimens = Object.keys(canvasDimens).reduce((acc, dimens) => {
      acc[dimens] = Number(canvasDimens[dimens])
      if (canvasDimens[dimens] === "") acc[dimens] = NaN
      return acc
    }, {})
    if (Object.values(validDimens).every((dimens) => !isNaN(dimens))) {
      const canvas = canvasRef.current
      const canvasWidth = canvasBounds.width
      const canvasHeight = canvasBounds.height
      const context = canvas.getContext("2d")

      canvas.setAttribute("width", `${canvasWidth}`)
      canvas.setAttribute("height", `${canvasHeight}`)

      const { xMin, xMax } = validDimens
      const aspectRatio = canvasWidth / canvasHeight
      const yMin = -(xMax - xMin) / 2 / aspectRatio
      const yMax = (xMax - xMin) / 2 / aspectRatio
      let percentX, percentY, funcX, funcY, pixelX, pixelY

      if (xMin < 0 && xMax > 0) {
        context.beginPath()
        context.strokeStyle = "grey"
        context.lineWidth = 1
        context.moveTo((-xMin * canvasWidth) / (xMax - xMin), 0)
        context.lineTo((-xMin * canvasWidth) / (xMax - xMin), canvasHeight)
        context.stroke()
      }

      if (yMin < 0 && yMax > 0) {
        context.beginPath()
        context.strokeStyle = "grey"
        context.lineWidth = 1
        context.moveTo(0, (yMax * canvasHeight) / (yMax - yMin))
        context.lineTo(canvasWidth, (yMax * canvasHeight) / (yMax - yMin))
        context.stroke()
      }

      const trees = userFunctions.map((func) => {
        return (x) => createTree(parseInput(func)).evaluate({}, "x", [x, 0])[0]
      })

      const derivatives = userFunctions.map((func) => {
        return (x) => {
          const derivative = diff(createTree(parseInput(func)), createTree(parseInput("x")))
          return derivative.evaluate({}, "x", [x, 0])[0]
        }
      })

      if (trees) {
        trees.forEach((tree, k) => {
          context.beginPath()
          context.strokeStyle = "black"
          context.lineWidth = 2
          const n = canvasWidth / 2

          // const { startingPoint, result } = generateBezier(
          //   xMin,
          //   xMax,
          //   yMin,
          //   yMax,
          //   canvasWidth,
          //   canvasHeight,
          //   n,
          //   tree,
          //   derivatives[k]
          // )
          // console.log(result)
          // context.moveTo(...startingPoint)
          // for (let i = 0; i < n; i++) {
          //   context.bezierCurveTo(...result[i])
          // }

          for (let i = 0; i < n; i++) {
            try {
              percentX = i / n
              funcX = percentX * (xMax - xMin) + xMin
              funcY = tree(funcX)
              percentY = (funcY - yMin) / (yMax - yMin)
              pixelX = percentX * canvasWidth
              pixelY = canvasHeight * (1 - percentY)
            } catch {}
            context.lineTo(pixelX, pixelY)
          }
          context.stroke()
        })
      }
    }
  }, [userFunctions, canvasBounds, canvasDimens])

  const input = (id) => (
    <input
      onChange={handleChange}
      type="text"
      id={id}
      spellCheck="false"
      autoCorrect="off"
      autoCapitalize="off"
      autoComplete="off"
      value={canvasDimens[id]}
    />
  )

  return (
    <div className="window">
      <div onClick={toggleSettings} className="settings">
        <img src="/assets/icons/sliders.svg" alt="show/hide" width="24" height="24" />
      </div>
      <div ref={settingsRef} className="window-settings">
        <div>Window:</div>
        <div className="window-settings-xy">
          <div>
            <MathJax inline>{`$x\\in[$`}</MathJax>
          </div>
          {input("xMin")}
          <div>,</div>
          {input("xMax")}
          <div>
            <MathJax inline>{`$]$`}</MathJax>
          </div>
        </div>
        <div className="window-settings-xy">
          <div>
            <MathJax inline>{`$y\\in[$`}</MathJax>
          </div>
          {input("yMin")}
          <div>,</div>
          {input("yMax")}
          <div>
            <MathJax inline>{`$]$`}</MathJax>
          </div>
        </div>
        <div className="window-settings-square">
          <input type="checkbox" id="square" />
          <span>Square</span>
        </div>
      </div>
      <canvas ref={canvasRef} />
    </div>
  )
}
