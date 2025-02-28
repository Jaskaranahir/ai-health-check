import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [history, setHistory] = useState({
        symptoms: [],
        doctors: [],
        pharmacies: [],
    });

    useEffect(() => {
        // ✅ Check if user is logged in
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');

        if (!token) {
            navigate('/signin'); // Redirect to sign-in if not logged in
        } else {
            setUserEmail(email); // Set user email from localStorage
            fetchUserHistory(email);
        }
    }, [navigate]);

    // ✅ Fetch user history from backend (Mock for now)
    const fetchUserHistory = async (email) => {
        try {
            const response = await axios.get(`http://localhost:5001/user-history?email=${email}`);
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    // ✅ Logout function
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        navigate('/'); // Redirect to homepage after logout
    };

    return (
        <div style={styles.container}>
            <h1>Welcome, {userEmail}!</h1>
            <p>Your AI Health Symptom Checker Dashboard</p>

            {/* Quick Action Buttons */}
            <div style={styles.buttonContainer}>
                <button onClick={() => navigate('/symptom-check')} style={styles.button}>Check Symptoms</button>
                <button onClick={() => navigate('/contact-doctor')} style={styles.button}>Find a Doctor</button>
                <button onClick={() => navigate('/find-pharmacy')} style={styles.button}>Locate Pharmacies</button>
            </div>

            {/* User History */}
            <div style={styles.historySection}>
                <h2>Your Recent Activity</h2>

                <div style={styles.historyBox}>
                    <h3>🩺 Symptoms Checked</h3>
                    {history.symptoms.length > 0 ? (
                        <ul>
                            {history.symptoms.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    ) : <p>No symptoms checked yet.</p>}
                </div>

                <div style={styles.historyBox}>
                    <h3>👨‍⚕️ Doctors Contacted</h3>
                    {history.doctors.length > 0 ? (
                        <ul>
                            {history.doctors.map((doctor, index) => (
                                <li key={index}>{doctor}</li>
                            ))}
                        </ul>
                    ) : <p>No doctors searched yet.</p>}
                </div>

                <div style={styles.historyBox}>
                    <h3>🏥 Pharmacies Searched</h3>
                    {history.pharmacies.length > 0 ? (
                        <ul>
                            {history.pharmacies.map((pharmacy, index) => (
                                <li key={index}>{pharmacy}</li>
                            ))}
                        </ul>
                    ) : <p>No pharmacies searched yet.</p>}
                </div>
            </div>

            {/* Logout Button */}
            <button onClick={handleLogout} style={styles.logoutButton}>Log Out</button>
        </div>
    );
}

// ✅ Dashboard Styles
const styles = {
    container: {
        textAlign: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    buttonContainer: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
    },
    button: {
        padding: '10px 15px',
        fontSize: '16px',
        backgroundColor: '#4caf50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: '0.3s',
    },
    historySection: {
        marginTop: '30px',
        textAlign: 'left',
        padding: '0 20px',
    },
    historyBox: {
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '10px',
    },
    logoutButton: {
        marginTop: '20px',
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#d9534f',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
};

export default Dashboard;
