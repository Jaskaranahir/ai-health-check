import React, { useState } from 'react';
import axios from 'axios';

function ContactDoctor() {
    const [city, setCity] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [urgency, setUrgency] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        setError('');
        setLoading(true);
        setDoctors([]);

        if (!city.trim() || !specialty.trim()) {
            setError('Please enter both city and specialty.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5001/search-doctors', { city, specialty, urgency });
            setDoctors(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch doctors. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2>Find Doctors Near You</h2>
            <p>Refine your search by selecting a specialty, city, and urgency level.</p>

            <div style={styles.formGroup}>
                <label>Specialty:</label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={styles.input}>
                    <option value="">Select Specialty</option>
                    <option value="general practitioner">General Practitioner</option>
                    <option value="cardiologist">Cardiologist</option>
                    <option value="dentist">Dentist</option>
                    <option value="neurologist">Neurologist</option>
                    <option value="pediatrician">Pediatrician</option>
                    <option value="dermatologist">Dermatologist</option>
                </select>
            </div>

            <div style={styles.formGroup}>
                <label>City:</label>
                <input
                    type="text"
                    placeholder="Enter city (e.g., Toronto)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={styles.input}
                />
            </div>

            <div style={styles.formGroup}>
                <label>Urgency Level:</label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)} style={styles.input}>
                    <option value="">Select Urgency</option>
                    <option value="routine">Routine Checkup</option>
                    <option value="urgent">Urgent Consultation</option>
                    <option value="emergency">Emergency</option>
                </select>
            </div>

            <button onClick={handleSearch} style={styles.button}>Search</button>

            {error && <p style={styles.error}>{error}</p>}
            {loading && <p style={styles.loading}>Searching...</p>}

            <div style={styles.results}>
                {doctors.length > 0 ? (
                    doctors.map((doctor, index) => (
                        <div key={index} style={styles.card}>
                            <h3>{doctor.name}</h3>
                            <p><strong>Specialty:</strong> {doctor.specialty || 'Not Available'}</p>
                            <p><strong>Address:</strong> {doctor.address}</p>
                            <p><strong>Rating:</strong> {doctor.rating}</p>
                            <a href={doctor.googleMapsLink} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                View on Google Maps
                            </a>
                        </div>
                    ))
                ) : (
                    !loading && <p style={styles.noResults}>No results found.</p>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { textAlign: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' },
    formGroup: { marginBottom: '15px' },
    input: { padding: '10px', fontSize: '16px', width: '300px' },
    button: { padding: '10px 20px', fontSize: '16px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' },
    error: { color: 'red', marginTop: '10px' },
    loading: { color: '#007bff', marginTop: '10px' },
    results: { marginTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' },
    card: { background: '#f9f9f9', padding: '15px', margin: '10px', borderRadius: '5px', width: '300px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' },
    link: { display: 'block', marginTop: '10px', color: '#007bff', textDecoration: 'none' },
    noResults: { marginTop: '20px', color: '#666' },
};

export default ContactDoctor;
