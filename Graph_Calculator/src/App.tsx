import { useState } from 'react'
import './App.css'

import GraphCanvas from './components/GraphCanvas.tsx'
import InputBox from './components/InputBox.tsx'
import { parse } from 'mathjs';

function App() {

  // graph canvas uses formula from input box
  const [formula, setFormula] = useState('')
  const handleFormulaChange = (newFormula: string) => {
    try {
      // Validate formula by parsing it.
      // Optionally, you could try evaluating it for a test value here.
      parse(newFormula);
      
      // If no error is thrown, formula is legal.
      setFormula(newFormula);
    } catch (error) {
      // If an error occurs, the formula is illegal.
      // Don't update the state, thus waiting for a legal input.
      console.error("Illegal formula:", error);
    }
  }
  return (
    <>
    <h1>Marcus Graphing Calculator</h1>
      <div className="App">
        
        <header className="App-header">
          <InputBox onFormulaChange={handleFormulaChange} />
          <div className="Canvas"><GraphCanvas formula={formula} /></div>
        </header>
      </div>
    <h4>@Tianle Yuan</h4>
    </>
  )
}//

export default App
