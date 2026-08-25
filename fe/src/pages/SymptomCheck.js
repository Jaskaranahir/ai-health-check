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

const STEP_TITLES = ["What's going on?", 'Tell us more', 'Anything else with it?', 'About you'];
const STEP_INTROS = [
    "Start with what's bothering you most.",
    'A few quick details help us narrow things down.',
    "Optional - only answer what's relevant.",
    'Just one more thing before we take a look.',
];

const LOCATION_OPTIONS = [
    { value: 'head', label: 'Head' },
    { value: 'throat_neck', label: 'Throat / Neck' },
    { value: 'chest', label: 'Chest' },
    { value: 'abdomen', label: 'Abdomen' },
    { value: 'back', label: 'Back' },
    { value: 'joints_limbs', label: 'Joints / Limbs' },
    { value: 'skin', label: 'Skin' },
    { value: 'whole_body', label: 'Whole body / General' },
];

const DURATION_OPTIONS = [
    { value: 'less_than_day', label: 'Less than a day' },
    { value: '1-3_days', label: '1-3 days' },
    { value: 'week', label: 'About a week' },
    { value: 'more_than_week', label: 'More than a week' },
];

const ONSET_OPTIONS = [
    { value: 'sudden', label: 'Sudden' },
    { value: 'gradual', label: 'Gradual' },
];

const SEVERITY_OPTIONS = [
    { value: 'mild', label: 'Mild' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
];

const PROGRESSION_OPTIONS = [
    { value: 'better', label: 'Getting better' },
    { value: 'same', label: 'About the same' },
    { value: 'worse', label: 'Getting worse' },
];

const ASSOCIATED_SYMPTOM_OPTIONS = [
    { value: 'fever_chills', label: 'Fever or chills' },
    { value: 'nausea_vomiting', label: 'Nausea or vomiting' },
    { value: 'dizziness_fainting', label: 'Dizziness or fainting' },
    { value: 'rash', label: 'Rash' },
    { value: 'swelling', label: 'Swelling' },
    { value: 'numbness_weakness', label: 'Numbness or weakness' },
    { value: 'chest_pain', label: 'Chest pain' },
    { value: 'vision_changes', label: 'Vision changes' },
    { value: 'blood_unusual', label: 'Blood in stool, urine, or vomit' },
];

const AGE_GROUP_OPTIONS = [
    { value: '0-17', label: '0-17' },
    { value: '18-35', label: '18-35' },
    { value: '36-55', label: '36-55' },
    { value: '56+', label: '56+' },
];

const INITIAL_FORM_DATA = {
    symptoms: '',
    location: '',
    duration: '',
    onset: '',
    severity: '',
    progression: '',
    associatedSymptoms: [],
    betterOrWorse: '',
    ageGroup: '',
    additionalNotes: '',
};

const STEP_VALIDATORS = {
    1: (data) => data.symptoms.trim().length > 0,
    2: (data) => Boolean(data.duration && data.onset && data.severity && data.progression),
    3: () => true,
    4: (data) => Boolean(data.ageGroup),
};

function Chip({ label, selected, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{ ...styles.chip, ...(selected ? styles.chipSelected : {}) }}
        >
            {label}
        </button>
    );
}

function SymptomCheck() {
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [currentStep, setCurrentStep] = useState(1);
    const [stepError, setStepError] = useState(null);

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const selectSingle = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: prev[field] === value ? '' : value }));
    };

    const toggleMulti = (field, value) => {
        setFormData((prev) => {
            const list = prev[field];
            return {
                ...prev,
                [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
            };
        });
    };

    const handleNext = () => {
        if (!STEP_VALIDATORS[currentStep](formData)) {
            setStepError('Please answer this to continue.');
            return;
        }
        setStepError(null);
        setCurrentStep((step) => Math.min(step + 1, 4));
    };

    const handleBack = () => {
        setStepError(null);
        setCurrentStep((step) => Math.max(step - 1, 1));
    };

    const resetFlow = () => {
        setFormData(INITIAL_FORM_DATA);
        setCurrentStep(1);
        setStepError(null);
        setResults(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!STEP_VALIDATORS[4](formData)) {
            setStepError('Please select an age group to continue.');
            return;
        }

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
            <style>{'@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }'}</style>
            <div style={styles.centered}>
                <h1 style={styles.title}>AI Symptom Checker</h1>
                <p style={styles.subtitle}>A few quick questions to get a calm, clear health check.</p>

                {!results && (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.progressWrap}>
                            <div style={styles.progressLabel}>Step {currentStep} of 4</div>
                            <div style={styles.progressTrack}>
                                <div style={{ ...styles.progressFill, width: `${(currentStep / 4) * 100}%` }} />
                            </div>
                        </div>

                        <div key={currentStep} style={styles.stepContent}>
                            <h2 style={styles.stepHeading}>{STEP_TITLES[currentStep - 1]}</h2>
                            <p style={styles.stepIntro}>{STEP_INTROS[currentStep - 1]}</p>

                            {currentStep === 1 && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Describe what you're feeling</label>
                                        <textarea
                                            name="symptoms"
                                            value={formData.symptoms}
                                            onChange={handleChange}
                                            placeholder="E.g., sharp pain, fatigue, nausea..."
                                            style={styles.textarea}
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>
                                            Where are you feeling it? <span style={styles.optionalTag}>(optional)</span>
                                        </label>
                                        <div style={styles.chipRow}>
                                            {LOCATION_OPTIONS.map((opt) => (
                                                <Chip
                                                    key={opt.value}
                                                    label={opt.label}
                                                    selected={formData.location === opt.value}
                                                    onClick={() => selectSingle('location', opt.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>How long has this been going on?</label>
                                        <div style={styles.chipRow}>
                                            {DURATION_OPTIONS.map((opt) => (
                                                <Chip
                                                    key={opt.value}
                                                    label={opt.label}
                                                    selected={formData.duration === opt.value}
                                                    onClick={() => selectSingle('duration', opt.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Did it come on suddenly, or gradually?</label>
                                        <div style={styles.chipRow}>
                                            {ONSET_OPTIONS.map((opt) => (
                                                <Chip
                                                    key={opt.value}
                                                    label={opt.label}
                                                    selected={formData.onset === opt.value}
                                                    onClick={() => selectSingle('onset', opt.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>How severe does it feel?</label>
                                        <div style={styles.chipRow}>
                                            {SEVERITY_OPTIONS.map((opt) => (
                                                <Chip
                                                    key={opt.value}
                                                    label={opt.label}
                                                    selected={formData.severity === opt.value}
                                                    onClick={() => selectSingle('severity', opt.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Is it getting better, worse, or staying the same?</label>
                                        <div style={styles.chipRow}>
                                            {PROGRESSION_OPTIONS.map((opt) => (
                                                <Chip
                                                    key={opt.value}
                                                    label={opt.label}
                                                    selected={formData.progression === opt.value}
                                                    onClick={() => selectSingle('progression', opt.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 3 && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>
                                            Anything else alongside it? <span style={styles.optionalTag}>(optional)</span>
                                        </label>
                                        <div style={styles.chipRow}>
                                            {ASSOCIATED_SYMPTOM_OPTIONS.map((opt) => (
                                                <Chip
                                                    key={opt.value}
                                                    label={opt.label}
                                                    selected={formData.associatedSymptoms.includes(opt.value)}
                                                    onClick={() => toggleMulti('associatedSymptoms', opt.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>
                                            What makes it feel better or worse? <span style={styles.optionalTag}>(optional)</span>
                                        </label>
                                        <textarea
                                            name="betterOrWorse"
                                            value={formData.betterOrWorse}
                                            onChange={handleChange}
                                            placeholder="E.g., worse when lying down, better after eating..."
                                            style={styles.textareaShort}
                                        />
                                    </div>
                                </>
                            )}

                            {currentStep === 4 && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Age group</label>
                                        <div style={styles.chipRow}>
                                            {AGE_GROUP_OPTIONS.map((opt) => (
                                                <Chip
                                                    key={opt.value}
                                                    label={opt.label}
                                                    selected={formData.ageGroup === opt.value}
                                                    onClick={() => selectSingle('ageGroup', opt.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>
                                            Anything else you'd like to mention? <span style={styles.optionalTag}>(optional)</span>
                                        </label>
                                        <textarea
                                            name="additionalNotes"
                                            value={formData.additionalNotes}
                                            onChange={handleChange}
                                            placeholder="E.g., existing conditions, medications, pregnancy..."
                                            style={styles.textareaShort}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {stepError && <p style={styles.error}>{stepError}</p>}

                        <div style={styles.stepNav}>
                            {currentStep > 1 && (
                                <button type="button" onClick={handleBack} style={styles.backButton}>
                                    Back
                                </button>
                            )}
                            {currentStep < 4 && (
                                <button type="button" onClick={handleNext} style={styles.button}>
                                    Next
                                </button>
                            )}
                            {currentStep === 4 && (
                                <button type="submit" style={styles.button} disabled={loading}>
                                    {loading ? 'Analyzing...' : 'Check Symptoms'}
                                </button>
                            )}
                        </div>
                    </form>
                )}

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

                        <button type="button" onClick={resetFlow} style={styles.resetButton}>
                            Check another symptom
                        </button>
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
        padding: '20px',
    },
    centered: {
        width: '100%',
        maxWidth: '700px',
        padding: '30px',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        margin: '40px 0',
    },
    title: {
        textAlign: 'center',
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#333',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: '16px',
        marginBottom: '25px',
        color: '#555',
    },
    form: {
        width: '100%',
    },
    progressWrap: {
        marginBottom: '20px',
    },
    progressLabel: {
        fontSize: '13px',
        color: '#4caf50',
        fontWeight: 'bold',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
    },
    progressTrack: {
        height: '6px',
        background: '#e8f5e9',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        background: '#4caf50',
        borderRadius: '999px',
        transition: 'width 0.3s ease',
    },
    stepContent: {
        animation: 'fadeIn 0.25s ease',
    },
    stepHeading: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '4px',
    },
    stepIntro: {
        fontSize: '14px',
        color: '#777',
        marginBottom: '20px',
    },
    formGroup: {
        marginBottom: '22px',
    },
    label: {
        display: 'block',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '10px',
        fontSize: '15px',
    },
    optionalTag: {
        fontWeight: 'normal',
        color: '#999',
        fontSize: '13px',
    },
    textarea: {
        width: '100%',
        height: '100px',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    },
    textareaShort: {
        width: '100%',
        height: '60px',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    },
    chipRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
    },
    chip: {
        padding: '10px 16px',
        borderRadius: '999px',
        border: '1.5px solid #d7ddd7',
        background: '#fff',
        color: '#333',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    chipSelected: {
        background: '#4caf50',
        borderColor: '#4caf50',
        color: '#fff',
        fontWeight: 'bold',
    },
    stepNav: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px',
    },
    backButton: {
        padding: '15px 22px',
        fontSize: '16px',
        background: '#fff',
        color: '#4caf50',
        border: '1.5px solid #4caf50',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    button: {
        flex: 1,
        padding: '15px',
        fontSize: '16px',
        background: '#4caf50',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
    },
    results: {
        marginTop: '10px',
        padding: '20px',
        background: '#fafafa',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'left',
        lineHeight: '1.6',
        fontSize: '16px',
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
    resetButton: {
        display: 'block',
        margin: '18px auto 0',
        background: 'none',
        border: 'none',
        color: '#4caf50',
        fontSize: '14px',
        fontWeight: 'bold',
        textDecoration: 'underline',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: '10px',
        fontSize: '14px',
    },
};

export default SymptomCheck;
