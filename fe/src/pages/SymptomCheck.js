import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ai-health-check.onrender.com';

const URGENCY_PRESENTATION = {
    low: { label: 'Low urgency', background: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    medium: { label: 'Worth a closer look', background: '#fff8e1', color: '#a76a00', border: '#ffe082' },
    high: { label: 'See a doctor soon', background: '#ffebee', color: '#c62828', border: '#ef9a9a' },
};

const LIKELIHOOD_PRESENTATION = {
    low: { label: 'Less likely', background: '#eceff1', color: '#455a64' },
    moderate: { label: 'Possible', background: '#e3f2fd', color: '#1565c0' },
    high: { label: 'Most likely', background: '#ede7f6', color: '#5e35b1' },
};

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
            const response = await fetch(`${API_BASE_URL}/symptoms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch analysis.');
            }

            setResults(data);
        } catch (error) {
            setError(error.message || 'Error fetching AI analysis. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const urgency = URGENCY_PRESENTATION[results?.overallUrgency] || URGENCY_PRESENTATION.low;

    return (
        <div style={styles.container}>
            <div style={styles.centered}>
                <h1 style={styles.title}>AI Symptom Checker</h1>
                <p style={styles.subtitle}>Fill out the form below to get a calm, clear health check.</p>

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
                        <h2 style={styles.resultTitle}>Your Symptom Check</h2>

                        <div
                            style={{
                                ...styles.urgencyBanner,
                                background: urgency.background,
                                color: urgency.color,
                                borderColor: urgency.border,
                            }}
                        >
                            {urgency.label}
                        </div>

                        {results.disclaimer && <p style={styles.disclaimerBox}>{results.disclaimer}</p>}

                        <div style={styles.resultContent}>
                            <h3 style={styles.resultSectionTitle}>What this could be</h3>
                            {(results.possibleConditions || []).map((item, index) => {
                                const likelihood = LIKELIHOOD_PRESENTATION[item.likelihood] || LIKELIHOOD_PRESENTATION.low;
                                return (
                                    <div key={index} style={styles.conditionCard}>
                                        <div style={styles.conditionCardHeader}>
                                            <span style={styles.conditionName}>{item.condition}</span>
                                            <span
                                                style={{
                                                    ...styles.likelihoodBadge,
                                                    background: likelihood.background,
                                                    color: likelihood.color,
                                                }}
                                            >
                                                {likelihood.label}
                                            </span>
                                        </div>
                                        <p style={styles.resultParagraph}>{item.explanation}</p>
                                    </div>
                                );
                            })}

                            {results.selfCareSteps?.length > 0 && (
                                <>
                                    <h3 style={styles.resultSectionTitle}>Things that may help</h3>
                                    <ul style={styles.resultList}>
                                        {results.selfCareSteps.map((step, index) => (
                                            <li key={index} style={styles.resultListItem}>{step}</li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {results.whenToSeeADoctor?.length > 0 && (
                                <div style={styles.doctorCareBox}>
                                    <h3 style={styles.resultSectionTitle}>When to see a doctor</h3>
                                    <ul style={styles.resultList}>
                                        {results.whenToSeeADoctor.map((step, index) => (
                                            <li key={index} style={styles.resultListItem}>{step}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div style={styles.ctaRow}>
                            <Link to="/contact-doctor" style={styles.ctaButton}>Find a Nearby Doctor</Link>
                            <Link to="/find-pharmacy" style={styles.ctaButtonSecondary}>Find a Nearby Pharmacy</Link>
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
        minHeight: '100vh',
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
        margin: '40px 0',
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
        background: '#fafafa',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'left', // Left-align for better readability
        lineHeight: '1.6', // Add better line height
        fontSize: '16px', // Larger font for clarity
    },
    resultTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '15px',
    },
    urgencyBanner: {
        display: 'inline-block',
        padding: '8px 16px',
        borderRadius: '20px',
        border: '1px solid',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '15px',
    },
    disclaimerBox: {
        fontSize: '13px',
        color: '#666',
        background: '#f0f4f8',
        border: '1px solid #dbe4ec',
        borderRadius: '8px',
        padding: '12px 14px',
        marginBottom: '20px',
    },
    resultContent: {
        marginTop: '10px',
    },
    resultSectionTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '10px',
        marginTop: '20px',
        color: '#333',
    },
    resultParagraph: {
        fontSize: '15px',
        marginBottom: '0',
        color: '#555',
    },
    conditionCard: {
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '12px',
    },
    conditionCardHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '6px',
    },
    conditionName: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333',
    },
    likelihoodBadge: {
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '4px 10px',
        borderRadius: '12px',
        whiteSpace: 'nowrap',
    },
    doctorCareBox: {
        background: '#fff8f0',
        border: '1px solid #f3ddb8',
        borderRadius: '8px',
        padding: '14px 16px',
        marginTop: '10px',
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
    ctaRow: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginTop: '25px',
    },
    ctaButton: {
        flex: '1 1 200px',
        textAlign: 'center',
        padding: '12px',
        background: '#4caf50',
        color: '#fff',
        borderRadius: '5px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    ctaButtonSecondary: {
        flex: '1 1 200px',
        textAlign: 'center',
        padding: '12px',
        background: '#fff',
        color: '#4caf50',
        border: '1px solid #4caf50',
        borderRadius: '5px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 'bold',
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
