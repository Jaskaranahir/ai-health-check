import React, { useState } from 'react';
import axios from 'axios';

function FindPharmacy() {
    const [city, setCity] = useState('');
    const [openNow, setOpenNow] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const [pharmacies, setPharmacies] = useState([]);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setPharmacies([]);

        if (!city) {
            setError('Please enter a city.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5001/find-pharmacies', {
                city,
                openNow,
                minRating,
            });

            setPharmacies(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch pharmacies.');
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Find Nearby Pharmacies</h1>

            <form onSubmit={handleSearch} style={styles.form}>
                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name"
                    required
                    style={styles.input}
                />
                <label style={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={openNow}
                        onChange={(e) => setOpenNow(e.target.checked)}
                    />
                    Show only 24-hour pharmacies
                </label>

                <label style={styles.label}>
                    Minimum Rating:
                    <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} style={styles.select}>
                        <option value="0">Any</option>
                        <option value="3">3+ ⭐</option>
                        <option value="4">4+ ⭐</option>
                        <option value="4.5">4.5+ ⭐</option>
                    </select>
                </label>

                <button type="submit" style={styles.button}>Search</button>
            </form>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.resultsContainer}>
                {pharmacies.map((pharmacy, index) => (
                    <div key={index} style={styles.pharmacyCard}>
                        <h3>{pharmacy.name}</h3>
                        <p>{pharmacy.address}</p>
                        <p>⭐ {pharmacy.rating}</p>
                        <p style={{ color: pharmacy.openNow === 'Open Now' ? 'green' : 'red' }}>{pharmacy.openNow}</p>
                        <a href={pharmacy.googleMapsLink} target="_blank" rel="noopener noreferrer" style={styles.mapLink}>
                            View on Google Maps
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ✅ Styles
const styles = {
    container: { textAlign: 'center', padding: '20px', maxWidth: '600px', margin: '0 auto' },
    title: { fontSize: '24px', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' },
    label: { fontSize: '14px', textAlign: 'left' },
    select: { padding: '5px', fontSize: '14px' },
    button: { padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    error: { color: 'red', marginTop: '10px' },
    resultsContainer: { marginTop: '20px' },
    pharmacyCard: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '10px' },
    mapLink: { color: '#007bff', textDecoration: 'none', fontSize: '14px' },
};

export default FindPharmacy;
