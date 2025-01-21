import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [symptoms, setSymptoms] = useState('');
    const [results, setResults] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/symptoms', { symptoms });
            setResults(response.data);
        } catch (error) {
            console.error('Error connecting to backend:', error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>AI Health Symptom Checker</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Enter symptoms"
                    style={{ padding: '10px', marginRight: '10px', width: '300px' }}
                />
                <button type="submit" style={{ padding: '10px' }}>Check</button>
            </form>
            {results && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Results:</h2>
                    <pre>{JSON.stringify(results, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default App;
