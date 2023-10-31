import React, { useState } from "react";

interface InputBoxProps {
    onFormulaChange: (formula: string) => void;
}

const InputBox: React.FC<InputBoxProps> = ({ onFormulaChange }) => {
    const [formula, setFormula] = useState("");

    const handleFormulaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFormula = event.target.value;
        setFormula(newFormula);
        onFormulaChange(newFormula);
    };

    return (
        <div>
            <label htmlFor="formula-input">Formula:</label>
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
