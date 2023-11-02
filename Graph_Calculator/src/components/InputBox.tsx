import React, { useState } from "react";

interface InputBoxProps {
    onFormulaChange: (formula: string) => void;
}

const InputBox: React.FC<InputBoxProps> = ({ onFormulaChange }) => {
    const [formula, setFormula] = useState("z=cos(x)^2+sin(y)^2");

    const handleFormulaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFormula = event.target.value;
        setFormula(newFormula);
        onFormulaChange(newFormula);
    };

    const clearFormula = () => {
        setFormula("");
        onFormulaChange("");
    };

    return (
        <div className="InputBox" style={{ marginLeft: "33%", marginBottom: '2%', marginTop: '-1%'}}>
            <label htmlFor="formula-input">Formula: </label>
            <input
                id="formula-input"
                type="text"
                value={formula}
                onChange={handleFormulaChange}
            />
            <button onClick={clearFormula} style={{
        padding: '5px 10px', // Adjust padding to change the size
        fontSize: '0.8em',  // Smaller font size for the button text
        margin: '5px',      // Margin around the button
        borderRadius: '4px', // Rounded corners (optional)

    }}>Clear</button>
        </div>
    );
};

export default InputBox;
