import React, { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useResizeObserver } from "../utils/UseResizeObserver.js"
import { MathJax } from "better-react-mathjax"
import { parseInput } from "../utils/math/shared/Parsing.mjs"
import createTree from "../utils/math/tree/CreateTree.mjs"
import { diff } from "../utils/math/functions/Symbolic.mjs"

export default function Graph({ userFunctions }) {
  const initialWindow = { xMin: -5, xMax: 5 }
  const [displayWindow, setDisplayWindow] = useState(initialWindow)
  const [canvasDimens, setCanvasDimens] = useState({})
  const [renderControl, setRenderControl] = useState(false)
  const canvasRef = useRef(null)
  const settingsRef = useRef(null)
  const windowRef = useRef(null)
  const canvasBounds = useResizeObserver(canvasRef)
  const windowBounds = useResizeObserver(windowRef)

  const toggleSettings = () => {
    const settings = settingsRef.current
    if (settings.style.display === "block") {
      settings.style.display = "none"
    } else {
      settings.style.display = "block"
    }
  }

  const handleChange = ({ target }) => {
    setDisplayWindow({ ...displayWindow, [target.name]: target.value })
  }

  useEffect(() => {
    setRenderControl(true)
  }, [canvasBounds, displayWindow])

  useLayoutEffect(() => {
    const validNumbers = Object.keys(displayWindow).reduce((acc, dimens) => {
      acc[dimens] = Number(displayWindow[dimens])
      if (displayWindow[dimens] === "") acc[dimens] = NaN
      return acc
    }, {})

    if (renderControl && Object.values(validNumbers).every((dimens) => !isNaN(dimens))) {
      const canvasWidth = canvasBounds.width
      const canvasHeight = canvasBounds.height
      const aspectRatio = canvasWidth / canvasHeight
      const conversion = (validNumbers.xMax - validNumbers.xMin) / windowBounds.width
      if (windowBounds.width === 0) conversion = 0

      const xMin = validNumbers.xMin - conversion * windowBounds.left
      const xMax = validNumbers.xMax + conversion * (canvasBounds.right - windowBounds.right)
      const yMin = -(xMax - xMin) / 2 / aspectRatio
      const yMax = (xMax - xMin) / 2 / aspectRatio

      setCanvasDimens({ xMin, xMax, yMin, yMax })
      setRenderControl(false)
    }
  }, [renderControl, canvasBounds, displayWindow, windowBounds])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const canvasWidth = canvasBounds.width
    const canvasHeight = canvasBounds.height
    const context = canvas.getContext("2d")

    canvas.setAttribute("width", `${canvasWidth}`)
    canvas.setAttribute("height", `${canvasHeight}`)

    const { xMin, xMax, yMin, yMax } = canvasDimens
    let percentX, percentY, funcX, funcY, pixelX, pixelY

    const trees = userFunctions.map((func) => {
      return (x) => createTree(parseInput(func)).evaluate({}, "x", [x, 0])
    })

    const derivatives = userFunctions.map((func) => {
      return (x) =>
        diff(createTree(parseInput(func)), createTree(parseInput("x"))).evaluate({}, "x", [x, 0])
    })

    if (trees) {
      trees.forEach((tree, k) => {
        context.beginPath()
        context.strokeStyle = "black"
        context.lineWidth = 2
        const n = canvasWidth 
        for (let i = 0; i < n; i ++) {
          let bezX1, bezX2, bezY1, bezY2

          try {
            percentX = i / n
            funcX = percentX * (xMax - xMin) + xMin
            funcY = tree(funcX)[0]
            percentY = (funcY - yMin) / (yMax - yMin)
            pixelX = percentX * canvasWidth
            pixelY = canvasHeight * (1 - percentY)




          } catch {}
          context.lineTo(pixelX, pixelY)
        }
        

        context.stroke()
      })
    }
  }, [userFunctions, canvasBounds, canvasDimens])

  return (
    <div ref={windowRef} className="window">
      <div onClick={toggleSettings} className="settings">
        <img src="/assets/icons/sliders.svg" alt="show/hide" width="24" height="24" />
      </div>
      <div ref={settingsRef} className="window-settings">
        <div>Window:</div>
        <div className="window-settings-xy">
          <div>
            <MathJax inline>{`$x\\in[$`}</MathJax>
          </div>
          <input onChange={handleChange} type="text" name="xMin" value={displayWindow.xMin} />
          <div>,</div>
          <input onChange={handleChange} type="text" name="xMax" value={displayWindow.xMax} />
          <div>
            <MathJax inline>{`$]$`}</MathJax>
          </div>
        </div>
        <div className="window-settings-xy">
          <div>
            <MathJax inline>{`$y\\in[$`}</MathJax>
          </div>
          <input onChange={handleChange} type="text" name="yMin" value={displayWindow.yMin} />
          <div>,</div>
          <input onChange={handleChange} type="text" name="yMax" value={displayWindow.yMax} />
          <div>
            <MathJax inline>{`$]$`}</MathJax>
          </div>
        </div>
        <div className="window-settings-square">
          <input type="checkbox" name="square" />
          <span>Square</span>
        </div>
      </div>
      <canvas ref={canvasRef} />
    </div>
  )
}