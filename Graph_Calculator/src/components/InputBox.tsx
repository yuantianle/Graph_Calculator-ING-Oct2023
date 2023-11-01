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

    return (
        <div className="InputBox" style={{ marginLeft: "-15%" }}>
            <label htmlFor="formula-input">Formula: </label>
            <input
                id="formula-input"
                type="text"
                value={formula}
                onChange={handleFormulaChange}
            />
        </div>
    );
};

export default InputBox;
