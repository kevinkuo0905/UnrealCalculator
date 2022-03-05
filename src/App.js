import React from "react"
import { MathJaxContext } from "better-react-mathjax"
import Panels from "./components/Panels"
import Grapher from "./grapher/Grapher"
import Calculator from "./calculator/Calculator"
import "./App.css"

function App() {
  const src = "/assets/mathjax/tex-mml-chtml.js"
  const config = {
    loader: { load: ["input/asciimath"] },
    asciimath: { displaystyle: true, delimiters: [["$", "$"]] },
    options: { enableMenu: false },
  }

  return (
    <MathJaxContext src={src} config={config}>
      <div id="container">
        <header></header>
        <main>
          <Panels percentage={70} minRatio={50} maxRatio={80}>
            <Grapher />
            <Calculator />
          </Panels>
        </main>
      </div>
    </MathJaxContext>
  )
}

export default App
