import React from "react"
import { MathJaxContext } from "better-react-mathjax"
import Main from "./components/Main"
import "./App.css"

function App() {
  const src = "/assets/mathjax/tex-svg.js"
  const mathConfig = {
    loader: { load: ["[tex]/html"] },
    tex: {
      inlineMath: [["$", "$"]],
      processEscapes: true,
    },
    options: { enableMenu: false },
  }

  return (
    <MathJaxContext src={src} config={mathConfig}>
      <div id="container">
        <Main />
      </div>
    </MathJaxContext>
  )
}

export default App
