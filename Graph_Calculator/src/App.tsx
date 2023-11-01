import { useState } from 'react'
import './App.css'

import GraphCanvas from './components/GraphCanvas.tsx'
import InputBox from './components/InputBox.tsx'

function App() {

  // graph canvas uses formula from input box
  const [formula, setFormula] = useState('z=cos(x)^2+sin(y)^2')
  const handleFormulaChange = (newFormula: string) => {
      setFormula(newFormula);
  }
  //optional initial formula: 
  //(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y
  
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
