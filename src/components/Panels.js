import React, { useRef, useEffect } from "react"
import { min, max } from "../utils/functions/Real.mjs"
import "./Panels.css"

export default function Panels({
  children,
  vertical = false,
  percentage = 50,
  minRatio = 15,
  maxRatio = 85,
  alwaysShowFirst = false,
  alwaysShowSecond = false,
}) {
  const containerRef = useRef(null)
  const resizeRef = useRef(null)
  const firstRef = useRef(null)
  const secondRef = useRef(null)
  const firstButtonRef = useRef(null)
  const secondButtonRef = useRef(null)
  const orientation = vertical ? "height" : "width"

  useEffect(() => {
    const container = containerRef.current
    const resizer = resizeRef.current
    const first = firstRef.current
    const second = secondRef.current
    const firstButton = firstButtonRef.current
    const secondButton = secondButtonRef.current
    let containerDimens, firstDimens, secondDimens, point

    const onMouseDownResize = (event) => {
      containerDimens = vertical ? container.clientHeight : container.clientWidth
      firstDimens = (100 * parseInt(window.getComputedStyle(first)[orientation])) / containerDimens
      secondDimens = 100 - firstDimens
      point = vertical ? event.clientY : event.clientX

      if (event.button === 0) {
        first.style.userSelect = "none"
        first.style.transition = "none"
        second.style.userSelect = "none"
        second.style.transition = "none"
        document.addEventListener("mousemove", onMouseMoveResize)
        document.addEventListener("mouseup", onMouseUpResize)
      }
    }

    const onMouseMoveResize = (event) => {
      const mousePointer = vertical ? event.clientY : event.clientX
      const change = (100 * (mousePointer - point)) / containerDimens

      if ((firstDimens > minRatio || change > 0) && (firstDimens < maxRatio || change < 0)) {
        point = mousePointer
        if (change < 0) firstDimens = max(firstDimens + change, minRatio)
        if (change > 0) firstDimens = min(firstDimens + change, maxRatio)
        secondDimens = 100 - firstDimens

        first.style[orientation] = `${firstDimens}%`
        second.style[orientation] = `${secondDimens}%`
      }
    }

    const onMouseUpResize = () => {
      first.style.userSelect = ""
      second.style.userSelect = ""
      first.style.transition = ""
      second.style.transition = ""
      document.removeEventListener("mousemove", onMouseMoveResize)
      document.removeEventListener("mouseup", onMouseUpResize)
    }

    const onMouseOver = () => {
      first.style.userSelect = "none"
      second.style.userSelect = "none"
    }

    const onMouseOut = () => {
      first.style.userSelect = ""
      second.style.userSelect = ""
    }

    const onMouseClick = ({ currentTarget }) => {
      const button = currentTarget.className.includes("first") ? 1 : 2

      if (
        (first.style[orientation] === "100%" && button === 1) ||
        (second.style[orientation] === "100%" && button === 2)
      ) {
        first.style[orientation] = `${percentage}%`
        second.style[orientation] = `${100 - percentage}%`
        firstButton.style.display = ""
        secondButton.style.display = ""
        if (alwaysShowFirst) firstButton.style.display = "none"
        if (alwaysShowSecond) secondButton.style.display = "none"
        resizer.style.display = ""
      } else {
        if (button === 1) {
          first.style[orientation] = "0%"
          second.style[orientation] = "100%"
          secondButton.style.display = ""
        } else {
          first.style[orientation] = "100%"
          second.style[orientation] = "0%"
          firstButton.style.display = ""
        }
        currentTarget.style.display = "none"
        resizer.style.display = "none"
      }
    }

    container.style.flexDirection = vertical ? "column" : "row"
    resizer.className = vertical ? "vertical-resize" : "horizontal-resize"
    resizer.addEventListener("mousedown", onMouseDownResize)
    resizer.addEventListener("mouseover", onMouseOver)
    resizer.addEventListener("mouseout", onMouseOut)

    first.style[orientation] = `${percentage}%`
    second.style[orientation] = `${100 - percentage}%`

    if (alwaysShowFirst) firstButton.style.display = "none"
    if (alwaysShowSecond) secondButton.style.display = "none"

    firstButton.classList.add(vertical ? "vertical" : "horizontal")
    secondButton.classList.add(vertical ? "vertical" : "horizontal")

    firstButton.addEventListener("click", onMouseClick)
    secondButton.addEventListener("click", onMouseClick)

    return () => {
      firstButton.removeEventListener("click", onMouseClick)
      secondButton.removeEventListener("click", onMouseClick)
      resizer.removeEventListener("mousedown", onMouseDownResize)
      resizer.removeEventListener("mouseover", onMouseOver)
      resizer.removeEventListener("mouseout", onMouseOut)
    }
  })

  return (
    <div ref={containerRef} className="container">
      <div ref={firstRef} className="panel-container">
        <div ref={firstButtonRef} className="show-hide first">
          <img src="/assets/icons/double-right.svg" alt="show/hide" width="24" height="24" />
        </div>
        {children[0]}
      </div>
      <div ref={resizeRef} />
      <div ref={secondRef} className="panel-container">
        <div ref={secondButtonRef} className="show-hide second">
          <img src="/assets/icons/double-right.svg" alt="show/hide" width="24" height="24" />
        </div>
        {children[1]}
      </div>
    </div>
  )
}
