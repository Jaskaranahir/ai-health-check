import React, { useState } from 'react';

function SymptomCheck() {
    const [formData, setFormData] = useState({
        symptoms: '',
        duration: '',
        severity: '',
        factors: [],
        ageGroup: '',
    });

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handle text input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle checkbox selections
    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            factors: checked
                ? [...prevData.factors, value]
                : prevData.factors.filter((factor) => factor !== value),
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResults(null);
    
        try {
            const response = await fetch('http://localhost:5001/symptoms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
    
            if (!response.ok) {
                throw new Error('Failed to fetch analysis.');
            }
    
            const data = await response.json();
            console.log("API Response:", data);  // ✅ Log response for debugging
    
            setResults(data);
        } catch (error) {
            setError('Error fetching AI analysis. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div style={styles.container}>
            <div style={styles.centered}>
                <h1 style={styles.title}>AI Symptom Checker</h1>
                <p style={styles.subtitle}>Fill out the form below to get an AI-based health analysis.</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label>Describe your symptoms (Required):</label>
                        <textarea
                            name="symptoms"
                            value={formData.symptoms}
                            onChange={handleChange}
                            placeholder="E.g., headache, fever, fatigue..."
                            style={styles.textarea}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label>Duration of symptoms (Required):</label>
                        <select name="duration" value={formData.duration} onChange={handleChange} style={styles.select} required>
                            <option value="">Select duration</option>
                            <option value="less_than_day">Less than a day</option>
                            <option value="1-3_days">1-3 days</option>
                            <option value="week">A week</option>
                            <option value="more_than_week">More than a week</option>
                        </select>
                    </div>

                    <div style={styles.formGroup}>
                        <label>Severity of symptoms (Required):</label>
                        <div style={styles.radioGroup}>
                            <label>
                                <input type="radio" name="severity" value="mild" checked={formData.severity === 'mild'} onChange={handleChange} required />
                                Mild
                            </label>
                            <label>
                                <input type="radio" name="severity" value="moderate" checked={formData.severity === 'moderate'} onChange={handleChange} required />
                                Moderate
                            </label>
                            <label>
                                <input type="radio" name="severity" value="severe" checked={formData.severity === 'severe'} onChange={handleChange} required />
                                Severe
                            </label>
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label>Other factors (Optional):</label>
                        <div style={styles.checkboxGroup}>
                            <label>
                                <input type="checkbox" value="fever" onChange={handleCheckboxChange} /> Fever
                            </label>
                            <label>
                                <input type="checkbox" value="cough" onChange={handleCheckboxChange} /> Cough
                            </label>
                            <label>
                                <input type="checkbox" value="breathing_difficulty" onChange={handleCheckboxChange} /> Difficulty Breathing
                            </label>
                            <label>
                                <input type="checkbox" value="headache" onChange={handleCheckboxChange} /> Headache
                            </label>
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label>Age Group (Required):</label>
                        <select name="ageGroup" value={formData.ageGroup} onChange={handleChange} style={styles.select} required>
                            <option value="">Select age group</option>
                            <option value="0-17">0-17</option>
                            <option value="18-35">18-35</option>
                            <option value="36-55">36-55</option>
                            <option value="56+">56+</option>
                        </select>
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Analyzing...' : 'Check Symptoms'}
                    </button>
                </form>

                {error && <p style={styles.error}>{error}</p>}

                {results && (
                   <div style={styles.results}>
                       <h2 style={styles.resultTitle}>AI Health Analysis</h2>
                       <div style={styles.resultContent}>
                           <h3 style={styles.resultSectionTitle}>Possible Diagnosis</h3>
                           <p style={styles.resultParagraph}>
                               {results.analysis.includes("Possible Medical Conditions:")
                                   ? results.analysis.split("Possible Medical Conditions:")[1].split("**Steps the Person Should Take:**")[0].trim()
                                   : "No diagnosis found."}
                           </p>
               
                           <h3 style={styles.resultSectionTitle}>Advice</h3>
                           <p style={styles.resultParagraph}>
                               {results.analysis.includes("**Steps the Person Should Take:**")
                                   ? results.analysis.split("**Steps the Person Should Take:**")[1].split("**Should they consult a doctor immediately?**")[0].trim()
                                   : "No advice found."}
                           </p>
    
                       </div>
                   </div>
                )}  
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5',
        padding: '20px', // Add padding to avoid cutoff on smaller screens
    },
    centered: {
        width: '100%',
        maxWidth: '700px', // Increase max width for better spacing
        padding: '30px', // Add more padding for a cleaner look
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    title: {
        textAlign: 'center',
        fontSize: '28px', // Slightly larger title
        fontWeight: 'bold', // Add bold for emphasis
        marginBottom: '20px',
        color: '#333',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: '16px',
        marginBottom: '20px',
        color: '#555',
    },
    form: {
        width: '100%',
    },
    formGroup: {
        marginBottom: '20px',
    },
    textarea: {
        width: '100%',
        height: '100px', // Increased height for better visibility
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px', // Larger font for better readability
    },
    select: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
    },
    radioGroup: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'space-around', // Space out radio buttons evenly
    },
    checkboxGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px', // Increase gap for better readability
    },
    button: {
        width: '100%',
        padding: '15px', // Increase padding for larger button
        fontSize: '16px', // Larger font for accessibility
        background: '#4caf50',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease', // Add hover effect
    },
    results: {
        marginTop: '30px',
        padding: '20px',
        background: '#e8f5e9', // Light green background for result section
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'left', // Left-align for better readability
        lineHeight: '1.6', // Add better line height
        fontSize: '16px', // Larger font for clarity
    },
    resultTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#4caf50',
        marginBottom: '15px',
    },
    resultSectionTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#333',
    },
    resultParagraph: {
        fontSize: '16px',
        marginBottom: '15px',
        color: '#555',
    },
    resultList: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        marginBottom: '10px',
        color: '#333',
    },
    resultListItem: {
        fontSize: '14px',
        marginBottom: '5px',
        color: '#333',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: '10px',
        fontSize: '14px', // Larger font for error messages
    },
    tooltip: {
        position: 'relative',
        cursor: 'help',
        marginLeft: '5px',
        display: 'inline-block',
    },
    tooltipIcon: {
        background: '#4caf50',
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '50%',
        fontSize: '12px',
        textAlign: 'center',
    },
    tooltipText: {
        position: 'absolute',
        top: '-40px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fff',
        color: '#333',
        padding: '5px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        zIndex: 10,
        visibility: 'hidden',
        opacity: 0,
        transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
    },
};



export default SymptomCheck;
