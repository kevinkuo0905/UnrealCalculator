import { useState, useEffect } from "react"

/**
 * Custom hook that returns the current position and size of the referenced element.
 * @param {Object} ref element referenced by useRef
 * @returns {Object} rectangle position and size
 */

export const useResizeObserver = (ref) => {
  const [bounds, setBounds] = useState({})
  useEffect(() => {
    const resizeTarget = ref.current
    const resizeObserver = new ResizeObserver((entries) => {
      setBounds(entries[0].target.getBoundingClientRect())
    })
    resizeObserver.observe(resizeTarget)
    return () => {
      resizeObserver.unobserve(resizeTarget)
    }
  }, [ref])
  return bounds
}
