import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SignIn.css';

function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLogin, setIsLogin] = useState(true); // Default to login mode
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ Redirect logged-in users to Dashboard
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!email || !password) {
            setMessage('⚠️ Please fill in all fields.');
            return;
        }

        try {
            const url = isLogin
                ? 'http://localhost:5001/login'  // Login URL
                : 'http://localhost:5001/create-account';  // Sign-up URL

            const response = await axios.post(url, { email, password });

            setMessage(response.data.message);

            if (response.data.token) {
                // ✅ Store token & email after login/sign-up
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('email', response.data.email);
                setMessage('✅ Login successful! Redirecting...');

                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                setEmail('');
                setPassword('');
            }
        } catch (error) {
            setMessage(error.response?.data?.error || '❌ Server error. Please try again.');
        }
    };

    return (
        <div className="signin-container">
            <div className="signin-header">
                <h1>{isLogin ? 'Login to Your Account' : 'Create Your Account'}</h1>
                <p>Access AI-powered health insights and medical services.</p>
            </div>

            <form className="signin-form" onSubmit={handleFormSubmit}>
                <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" className="submit-button">
                    {isLogin ? 'Sign In' : 'Create Account'}
                </button>
                {message && <p className="message">{message}</p>}
            </form>

            <p className="toggle-text">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <span onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? ' Create one' : ' Sign in'}
                </span>
            </p>
        </div>
    );
}

export default SignIn;
