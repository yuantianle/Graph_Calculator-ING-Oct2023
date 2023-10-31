import { useState } from 'react'
import './App.css'

import GraphCanvas from './components/GraphCanvas.tsx'
import InputBox from './components/InputBox.tsx'

function App() {

  // graph canvas uses formula from input box
  const [formula, setFormula] = useState('')
  const handleFormulaChange = (newFormula: string) => {
      setFormula(newFormula);
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
