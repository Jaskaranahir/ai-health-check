import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'; // Import Navbar
import SignIn from './pages/SignIn';
import HomePage from './pages/HomePage';
import SymptomCheck from './pages/SymptomCheck';
import ContactDoctor from './pages/ContactDoctor';
import Dashboard from './pages/Dashboard';
import Findpharmacy from './pages/Findpharmacy'; 



function PrivateRoute({ element }) {
    const token = localStorage.getItem('token'); // ✅ Check if user is logged in
    return token ? element : <Navigate to="/signin" />;
}



function App() {
    return (
        <Router>
            <Navbar /> {/* Navbar is now visible across all pages */}
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/symptom-check" element={<SymptomCheck />} />
                <Route path="/contact-doctor" element={<ContactDoctor />} />
                <Route path="/find-pharmacy" element={<Findpharmacy />} /> {/* ✅ Match the route to your file */}
                <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />

            </Routes>
        </Router>
    );
}

export default App;
