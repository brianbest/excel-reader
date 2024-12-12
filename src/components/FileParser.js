import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function FileParser() {
    const [issues, setIssues] = useState([]);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalRows, setTotalRows] = useState(0);

    // Allowed HTML tags
    const allowedTags = ['<b>', '</b>', '<i>', '</i>', '<br>', '</br>'];

    // Function to check for illegal HTML tags
    const findIllegalTags = (text) => {
        if (typeof text !== 'string') return false;
        
        const tagRegex = /<[^>]+>/g;
        const foundTags = text.match(tagRegex);
        
        if (!foundTags) return false;
        
        return foundTags.some(tag => !allowedTags.includes(tag.toLowerCase()));
    };

    const processChunk = async (jsonData, chunkSize = 1000) => {
        const foundIssues = [];
        const totalLength = jsonData.length;
        setTotalRows(totalLength);

        for (let i = 0; i < totalLength; i += chunkSize) {
            const chunk = jsonData.slice(i, i + chunkSize);
            
            // Process the chunk
            await new Promise((resolve) => {
                setTimeout(() => {
                    chunk.forEach((row, rowIndex) => {
                        row.forEach((cell, colIndex) => {
                            if (findIllegalTags(cell)) {
                                foundIssues.push({
                                    row: i + rowIndex + 1,
                                    column: colIndex + 1,
                                    content: cell
                                });
                            }
                        });
                    });
                    
                    // Update progress
                    const currentProgress = Math.min(
                        Math.round(((i + chunkSize) / totalLength) * 100),
                        100
                    );
                    setProgress(currentProgress);
                    
                    resolve();
                }, 0); // Small delay to allow UI updates
            });
        }

        return foundIssues;
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        setFileName(file.name);
        setIsProcessing(true);
        setProgress(0);
        setIssues([]);

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const foundIssues = await processChunk(jsonData);
                setIssues(foundIssues);
            } catch (error) {
                console.error('Error processing file:', error);
                // Handle error state here if needed
            } finally {
                setIsProcessing(false);
                setProgress(100);
            }
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
                    disabled={isProcessing}
                />
                {fileName && <p>File loaded: {fileName}</p>}
            </div>

            {isProcessing && (
                <div className="processing-indicator">
                    <div className="progress-bar">
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p>Processing... {progress}% complete</p>
                    <p>Analyzing {totalRows.toLocaleString()} rows</p>
                </div>
            )}

            <div className="results-section">
                {!isProcessing && issues.length > 0 && (
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
                )}
                {!isProcessing && fileName && issues.length === 0 && (
                    <p className="success-message">No illegal HTML tags found!</p>
                )}
            </div>
        </div>
    );
}

export default FileParser; 