import React, { useRef, useState, useLayoutEffect } from "react"
import { useResizeObserver } from "../utils/UseResizeObserver.js"
import { min, max } from "../utils/math/functions/Real.mjs"
import "./Panels.css"

export default function Panels({ children, config }) {
  const {
    ids = [null, null],
    column = false,
    percentage = 50,
    minRatio = 15,
    maxRatio = 85,
    alwaysShowFirst = false,
    alwaysShowSecond = false,
    onePanelOnlyMaxDimens = 0,
    onePanelDefault = 1,
    autoRotate = false,
  } = config
  const containerRef = useRef(null)
  const resizeRef = useRef(null)
  const firstRef = useRef(null)
  const secondRef = useRef(null)
  const firstButtonRef = useRef(null)
  const secondButtonRef = useRef(null)
  const [vertical, setVertical] = useState(column)
  const containerBounds = useResizeObserver(containerRef)

  useLayoutEffect(() => {
    const orientation = vertical ? "height" : "width"
    const first = firstRef.current
    const second = secondRef.current
    first.style[orientation] = `${percentage}%`
    second.style[orientation] = `${100 - percentage}%`
  }, [vertical, percentage])

  useLayoutEffect(() => {
    const orientation = vertical ? "height" : "width"
    const container = containerRef.current
    const first = firstRef.current
    const second = secondRef.current
    const firstButton = firstButtonRef.current
    const secondButton = secondButtonRef.current

    if (autoRotate) {
      setVertical(container.clientHeight / container.clientWidth > 1)
      first.style[vertical ? "width" : "height"] = "100%"
      second.style[vertical ? "width" : "height"] = "100%"
    }

    let containerDimens = vertical ? container.clientHeight : container.clientWidth

    if (containerDimens < onePanelOnlyMaxDimens) {
      if (onePanelDefault === 1) {
        second.style[orientation] = "0%"
        first.style[orientation] = "100%"
        firstButton.style.display = ""
      }
      if (onePanelDefault === 2) {
        first.style[orientation] = "0%"
        second.style[orientation] = "100%"
        secondButton.style.display = ""
      }
    }
  }, [containerBounds, autoRotate, vertical, onePanelOnlyMaxDimens, onePanelDefault])

  useLayoutEffect(() => {
    const orientation = vertical ? "height" : "width"
    const container = containerRef.current
    const resizer = resizeRef.current
    const first = firstRef.current
    const second = secondRef.current
    const firstButton = firstButtonRef.current
    const secondButton = secondButtonRef.current
    let containerDimens, firstDimens, secondDimens, point

    const onMouseDownResize = (event) => {
      if (event.button === 0) {
        point = vertical ? event.clientY : event.clientX
        containerDimens = vertical ? container.clientHeight : container.clientWidth
        firstDimens = (100 * (vertical ? first.clientHeight : first.clientWidth)) / containerDimens
        secondDimens = 100 - firstDimens

        first.style.transition = "none"
        second.style.transition = "none"

        document.addEventListener("mousemove", onMouseMoveResize)
        document.addEventListener("mouseup", onMouseUpResize)
      }
    }

    const onMouseMoveResize = (event) => {
      first.style.userSelect = "none"
      second.style.userSelect = "none"

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
      containerDimens = vertical ? container.clientHeight : container.clientWidth
      if (
        (first.style[orientation] === "100%" || second.style[orientation] === "100%") &&
        containerDimens > onePanelOnlyMaxDimens
      ) {
        first.style[orientation] = `${percentage}%`
        second.style[orientation] = `${100 - percentage}%`

        resizer.style.pointerEvents = ""
        firstButton.style.display = ""
        secondButton.style.display = ""

        if (alwaysShowFirst) firstButton.style.display = "none"
        if (alwaysShowSecond) secondButton.style.display = "none"
      } else {
        if (currentTarget.className.includes("first")) {
          first.style[orientation] = "0%"
          second.style[orientation] = "100%"
          secondButton.style.display = ""
        } else {
          second.style[orientation] = "0%"
          first.style[orientation] = "100%"
          firstButton.style.display = ""
        }
        currentTarget.style.display = "none"
        resizer.style.pointerEvents = "none"
      }
    }

    container.style.flexDirection = vertical ? "column" : "row"

    resizer.className = vertical ? "vertical-resize" : "horizontal-resize"
    resizer.addEventListener("mousedown", onMouseDownResize)
    resizer.addEventListener("mouseover", onMouseOver)
    resizer.addEventListener("mouseout", onMouseOut)

    if (alwaysShowFirst && first.style[orientation] !== "100%") {
      firstButton.style.display = "none"
    }
    if (alwaysShowSecond && second.style[orientation] !== "100%") {
      secondButton.style.display = "none"
    }

    firstButton.className = "show-hide first"
    secondButton.className = "show-hide second"

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
      <div ref={firstRef} id={ids[0]} className="panel-container">
        <div ref={firstButtonRef}>
          <img src="/assets/icons/double-right.svg" alt="show/hide" width="24" height="24" />
        </div>
        {children[0]}
      </div>
      <div ref={resizeRef}>
        <div className="separator" />
      </div>
      <div ref={secondRef} id={ids[1]} className="panel-container">
        <div ref={secondButtonRef}>
          <img src="/assets/icons/double-right.svg" alt="show/hide" width="24" height="24" />
        </div>
        {children[1]}
      </div>
    </div>
  )
}
