import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token'); // ✅ Check if user is logged in
    const userEmail = localStorage.getItem('email');

    const handleLogout = () => {
        localStorage.removeItem('token'); // ✅ Remove JWT token
        localStorage.removeItem('email'); // ✅ Remove email
        navigate('/'); // ✅ Redirect to Home
    };

    return (
        <nav style={styles.navbar}> 
            <h2 style={styles.logo}>AI Health Symptom Checker</h2>

            <div style={styles.navLinks}>
                <Link to="/" style={styles.navLink}>Home</Link>
                <Link to="/symptom-check" style={styles.navLink}>Symptom Check</Link>
                <Link to="/contact-doctor" style={styles.navLink}>Contact Doctor</Link>
                <Link to="/find-pharmacy" style={styles.navLink}>Find Pharmacy</Link>
            </div>

            <div style={styles.userSection}>
                {token ? (
                    <>
                        <span style={styles.userEmail}>Welcome, {userEmail}</span>
                        <button onClick={handleLogout} style={styles.logoutButton}>Log Out</button>
                    </>
                ) : (
                    <Link to="/signin" style={styles.navLink}>Sign In</Link>
                )}
            </div>
        </nav>
    );
}

const styles = {
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        background: '#4caf50',
        color: 'white',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    logo: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white',
    },
    navLinks: {
        display: 'flex',
        gap: '20px',
    },
    navLink: {
        textDecoration: 'none',
        color: 'white',
        fontSize: '16px',
        transition: 'color 0.3s',
    },
    navLinkHover: {
        color: '#f0f0f0',
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    userEmail: {
        fontSize: '14px',
        color: '#f0f0f0',
    },
    logoutButton: {
        padding: '6px 12px',
        background: 'red',
        color: 'white',
        border: 'none',
        fontSize: '14px',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background 0.3s',
    },
    logoutButtonHover: {
        background: '#b30000',
    },
};

export default Navbar;
