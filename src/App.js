import React from "react"
import { MathJaxContext } from "better-react-mathjax"
import Main from "./components/Main"
import Header from "./components/Header"
import "./App.css"

function App() {
  const src = "/assets/mathjax/tex-mml-chtml.js"
  const mathConfig = {
    loader: { load: ["input/asciimath"] },
    asciimath: { displaystyle: true, delimiters: [["$", "$"]] },
    options: { enableMenu: false },
  }

  return (
    <MathJaxContext src={src} config={mathConfig}>
      <div id="container">
        <Header/>
        <Main />
      </div>
    </MathJaxContext>
  )
}

export default App
