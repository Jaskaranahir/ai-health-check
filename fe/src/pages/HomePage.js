import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            {/* Hero Section */}
            <section style={styles.hero}>
                <h1 style={styles.title}>Welcome to AI Health Symptom Checker</h1>
                <p style={styles.subtitle}>
                    Your gateway to better health. Check your symptoms, locate pharmacies, and contact doctors with ease.
                </p>
                {/* ✅ "Get Started" button now correctly navigates to the Sign-In page */}
                <button
                    style={styles.button}
                    onClick={() => navigate('/signin')}
                    onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')}
                    onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                >
                    Get Started
                </button>
            </section>

            {/* Features Section */}
            <section style={styles.features}>
                <h2 style={styles.sectionTitle}>What We Offer</h2>
                <div style={styles.featuresGrid}>
                    {/* ✅ "Symptom Checker" now navigates correctly */}
                    <div
                        style={styles.featureCard}
                        onClick={() => navigate('/symptom-check')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        <h3>Symptom Checker</h3>
                        <p>Enter your symptoms and get an AI-based analysis of possible conditions.</p>
                    </div>

                    {/* ✅ "Locate Pharmacies" now navigates correctly */}
                    <div
                        style={styles.featureCard}
                        onClick={() => navigate('/find-pharmacy')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        <h3>Locate Pharmacies</h3>
                        <p>Find nearby pharmacies instantly using geolocation.</p>
                    </div>

                    {/* ✅ "Contact Doctors" now navigates correctly */}
                    <div
                        style={styles.featureCard}
                        onClick={() => navigate('/contact-doctor')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        <h3>Contact Doctors</h3>
                        <p>Connect with medical professionals for advice and consultations.</p>
                    </div>
                </div>
            </section>

            {/* History Section */}
            <section style={styles.history}>
                <h2 style={styles.sectionTitle}>Our Story</h2>
                <p style={styles.historyText}>
                    AI Health Symptom Checker was founded with the vision of empowering individuals to take control of their health.
                    Our platform integrates the latest AI technologies to deliver quick, reliable, and actionable insights, bridging the gap
                    between medical expertise and accessible healthcare solutions.
                </p>
            </section>
        </div>
    );
}

const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        color: '#333',
        margin: 0,
        padding: 0,
        backgroundColor: '#f9f9f9',
        lineHeight: '1.6',
    },
    hero: {
        textAlign: 'center',
        padding: '50px 20px',
        background: '#4caf50',
        color: '#fff',
    },
    title: {
        fontSize: '2.5rem',
        marginBottom: '20px',
    },
    subtitle: {
        fontSize: '1.2rem',
        marginBottom: '20px',
    },
    button: {
        padding: '10px 20px',
        fontSize: '1rem',
        backgroundColor: '#fff',
        color: '#4caf50',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out, background-color 0.3s ease',
    },
    features: {
        padding: '40px 20px',
    },
    sectionTitle: {
        fontSize: '2rem',
        textAlign: 'center',
        marginBottom: '30px',
    },
    featuresGrid: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '20px',
    },
    featureCard: {
        flex: '1 1 300px',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    history: {
        padding: '40px 20px',
        background: '#e8f5e9',
        textAlign: 'center',
    },
    historyText: {
        maxWidth: '800px',
        margin: '0 auto',
        lineHeight: '1.8',
    },
};

export default HomePage;
