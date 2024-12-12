import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function FileParser() {
    const [issues, setIssues] = useState([]);
    const [fileName, setFileName] = useState('');

    // Allowed HTML tags
    const allowedTags = ['<b>', '</b>', '<i>', '</i>', '<br>', '</br>'];

    // Function to check for illegal HTML tags
    const findIllegalTags = (text) => {
        if (typeof text !== 'string') return false;
        
        // Regular expression to find HTML tags
        const tagRegex = /<[^>]+>/g;
        const foundTags = text.match(tagRegex);
        
        if (!foundTags) return false;
        
        return foundTags.some(tag => !allowedTags.includes(tag.toLowerCase()));
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const foundIssues = [];

            // Check each cell in each row
            jsonData.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (findIllegalTags(cell)) {
                        foundIssues.push({
                            row: rowIndex + 1,
                            column: colIndex + 1,
                            content: cell
                        });
                    }
                });
            });

            setIssues(foundIssues);
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="file-parser">
            <div className="upload-section">
                <h2>Upload Excel or CSV File</h2>
                <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFile}
                />
                {fileName && <p>File loaded: {fileName}</p>}
            </div>

            <div className="results-section">
                {issues.length > 0 ? (
                    <div>
                        <h3>Found {issues.length} issues:</h3>
                        <ul>
                            {issues.map((issue, index) => (
                                <li key={index}>
                                    Row {issue.row}, Column {issue.column}: 
                                    <pre>{issue.content}</pre>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : fileName && (
                    <p>No illegal HTML tags found!</p>
                )}
            </div>
        </div>
    );
}

export default FileParser; 