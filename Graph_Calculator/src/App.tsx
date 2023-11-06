import { useState } from 'react';
import './App.css';

import GraphCanvas from './components/GraphCanvas';
import InputBox from './components/InputBox';

function App() {
    // Predefined formulas list
    const formulasList = [
        { formula: 'cos(x)*sin(y)+cos(y)*sin(z)+cos(z)*sin(x)', defaultText: 'Popcorn' },
        { formula: 'z^2=cos(x)^2+sin(y)^2', defaultText: 'Mattries' },
        { formula: 'cos(z)^2=cos(x)^2+sin(y)^2', defaultText: 'Time Machine' },
        { formula: 'x^2+y^2+z^2=40', defaultText: 'Sphere' },
        { formula: 'x^2+z^2=y^2', defaultText: 'Hour Glass' },
        { formula: 'x^2-z^2=y', defaultText: 'Hyperbolic Paraboloid' },
        { formula: 'y=7*exp(-(x^2+z^2)/2/2^2)', defaultText: 'Gaussian Function' },
        { formula: '(5-(x^2 + y^2)^0.5)^2+z^2=2^2', defaultText: 'Torus' }, //(R1-(x^2 + y^2)^0.5)^2+z^2=R2^2, r1>r2
        { formula: 'z=sin(sqrt(2*x^2+2*y^2))', defaultText: 'Ripple' },
        { formula: 'z*2=10-abs(x+y)-abs(y-x)', defaultText: 'Pyramid' },
        { formula: 'z=3/exp(x^2*y^2)', defaultText: 'Intersecting Fences' },
        { formula: 'z=sin(x)*cos(y)', defaultText: 'Bumps' },      

        { formula: '(x+3)^2+y^2-5*(x+3)=5*sqrt((x+3)^2+y^2)', defaultText: 'Cartesian Heart' },//x^2+y^2-a*x=a*sqrt(x^2+y^2)
        { formula: '(x^2+y^2)^2=7^2*(x^2-y^2)', defaultText: 'Lemniscate of Bernoulli' },//(x^2+y^2)^2=a^2*(x^2-y^2)
        { formula: 'e^(sin(sqrt(x^2*y^2))) =1', defaultText: 'Curtains' },

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
