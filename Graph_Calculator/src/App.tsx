import { useState } from 'react';
import './App.css';

import GraphCanvas from './components/GraphCanvas';
import InputBox from './components/InputBox';

function App() {
    // Predefined formulas list
    const formulasList = [
        { formula: 'z^2=cos(x)^2+sin(y)^2', defaultText: 'Mattries' },
        { formula: 'cos(z)^2=cos(x)^2+sin(y)^2', defaultText: 'Time Machine' },
        { formula: 'x^2+y^2+z^2=40', defaultText: 'Sphere' },
        { formula: 'z^2=x^2+y^2', defaultText: 'Hour Glass' },
        { formula: 'z*10=x^2-y^2', defaultText: 'Hyperbolic Paraboloid' },
        { formula: 'z=10*exp(-(x^2+y^2)/2/3^2)', defaultText: 'Gaussian Function' },
        { formula: '(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y', defaultText: 'Default Txt 2' },
        { formula: '(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y', defaultText: 'Default Text 2' },
        { formula: 'x^2+y^2-2*x=2*sqrt(x^2+y^2)', defaultText: 'Cartesian Heart' },
        { formula: '(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y', defaultText: 'Default Text 2' },
        { formula: '(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y', defaultText: 'Default Text 2' },
        { formula: '(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y', defaultText: 'Default Text 2' },
        { formula: '(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y', defaultText: 'Default Text 2' },
        { formula: '(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y', defaultText: 'Default Text 2' },
        { formula: '(0.64*sqrt(abs(x))-0.8+1.2^abs(x)*cos(200*x))*sqrt(cos(x))=y', defaultText: 'Default Text 2' },
        // ... more formulas
    ];

    // graph canvas uses formula from input box
    const [formula, setFormula] = useState(formulasList[0]['formula']);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to control sidebar visibility

    const handleFormulaChange = (newFormula: string) => {
        setFormula(newFormula);
    };

    // Function to handle formula selection from the list
    const handleFormulaSelect = (formula: string) => {
        setFormula(formula);
    };

    const toggleSidebar = () => { // Function to toggle sidebar
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            <h1>Marcus Graphing Calculator</h1>
            <div className="App">
                <header className="App-header">

                    <aside className={`FormulaList ${isSidebarOpen ? 'open' : 'closed'}`}>
                        <ul key={isSidebarOpen ? 'opened' : 'closed'}>
                            {formulasList.map((item, index) => (
                                <li key={index} onClick={() => handleFormulaSelect(item.formula)}
                                style={{ animationDelay: `${index * 0.2}s` }} // Each item will start its animation 0.1s after the previous one
                                >
                                    <span className="default-text">{item.defaultText}</span>
                                    <span className="formula-text">{item.formula}</span>
                                </li>
                            ))}
                        </ul>
                    </aside>
                    <div className="Controls">
                        <button onClick={toggleSidebar} className="ToggleSidebar">
                            {isSidebarOpen ? 'Hide Examples' : 'Show Examples'}
                        </button>
                        <InputBox onFormulaChange={handleFormulaChange} value={formula} />
                    </div>
                    <div className="Canvas"><GraphCanvas formula={formula} /></div>
                </header>
            </div>
            <h4>@Tianle Yuan</h4>
        </>
    );
}

export default App;
