import React, { useState } from 'react';
import Chip from '../components/Chip';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ai-health-check.onrender.com';

const RATING_OPTIONS = [
    { value: 0, label: 'Any rating' },
    { value: 3, label: '3+ ⭐' },
    { value: 4, label: '4+ ⭐' },
    { value: 4.5, label: '4.5+ ⭐' },
];

function formatDistance(km) {
    if (km == null) return '';
    if (km < 1) return `${Math.round(km * 1000)} m away`;
    return `${km} km away`;
}

function buildDirectionsLink(place, coords) {
    const destination = `${place.lat},${place.lng}`;
    if (coords) {
        return `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${destination}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

function FindPharmacy() {
    const [city, setCity] = useState('');
    const [coords, setCoords] = useState(null);
    const [locating, setLocating] = useState(false);
    const [locationNote, setLocationNote] = useState(null);
    const [openNow, setOpenNow] = useState(false);
    const [minRating, setMinRating] = useState(0);

    const [results, setResults] = useState(null);
    const [searchRadiusKm, setSearchRadiusKm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detailsByPlace, setDetailsByPlace] = useState({});

    const handleUseLocation = () => {
        if (!navigator.geolocation) {
            setLocationNote("Your browser doesn't support location access - please enter a city instead.");
            return;
        }
        setLocating(true);
        setLocationNote(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
                setLocationNote('Using your current location.');
                setLocating(false);
            },
            () => {
                setLocationNote("We couldn't access your location - please enter a city instead.");
                setLocating(false);
            },
            { timeout: 10000 }
        );
    };

    const handleToggleDetails = (placeId) => {
        setDetailsByPlace((prev) => {
            const existing = prev[placeId] || {};
            const nowExpanded = !existing.expanded;
            const next = { ...prev, [placeId]: { ...existing, expanded: nowExpanded } };

            if (nowExpanded && existing.phone === undefined && !existing.loading && !existing.error) {
                next[placeId] = { ...next[placeId], loading: true };
                fetchPlaceDetails(placeId);
            }

            return next;
        });
    };

    const fetchPlaceDetails = async (placeId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/place-details?placeId=${encodeURIComponent(placeId)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to load details.');
            setDetailsByPlace((prev) => ({
                ...prev,
                [placeId]: { ...prev[placeId], loading: false, phone: data.phone, weekdayText: data.weekdayText },
            }));
        } catch (err) {
            setDetailsByPlace((prev) => ({
                ...prev,
                [placeId]: { ...prev[placeId], loading: false, error: 'Could not load hours or phone number.' },
            }));
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');

        if (!coords && !city.trim()) {
            setError('Use your location, or enter a city.');
            return;
        }

        setLoading(true);
        setResults(null);
        setDetailsByPlace({});

        try {
            const response = await fetch(`${API_BASE_URL}/find-pharmacies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    openNow,
                    minRating,
                    ...(coords ? { lat: coords.lat, lng: coords.lng } : { city }),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch pharmacies.');
            }

            setResults(data.results);
            setSearchRadiusKm(data.searchRadiusKm);
        } catch (err) {
            setError(err.message || 'Failed to fetch pharmacies. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.centered}>
                <h1 style={styles.title}>Find a Pharmacy Nearby</h1>
                <p style={styles.subtitle}>Let's find somewhere close to pick up what you need.</p>

                <form onSubmit={handleSearch} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Location</label>
                        <button type="button" onClick={handleUseLocation} style={styles.locationButton} disabled={locating}>
                            {locating ? 'Finding your location...' : '📍 Use my location'}
                        </button>
                        {locationNote && <p style={styles.locationNote}>{locationNote}</p>}

                        <div style={styles.orDivider}>or enter a city</div>
                        <input
                            type="text"
                            placeholder="E.g., Toronto"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Minimum rating</label>
                        <div style={styles.chipRow}>
                            {RATING_OPTIONS.map((opt) => (
                                <Chip
                                    key={opt.value}
                                    label={opt.label}
                                    selected={minRating === opt.value}
                                    onClick={() => setMinRating(opt.value)}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.checkboxLabel}>
                            <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
                            Open now
                        </label>
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Searching...' : 'Find Pharmacies'}
                    </button>
                </form>

                {error && <p style={styles.error}>{error}</p>}

                {results && results.length === 0 && (
                    <p style={styles.emptyState}>
                        We couldn't find a pharmacy within {searchRadiusKm} km. Try widening your search or checking a nearby town.
                    </p>
                )}

                {results && results.length > 0 && (
                    <div style={styles.results}>
                        {results.map((pharmacy) => {
                            const details = detailsByPlace[pharmacy.placeId];
                            return (
                                <div key={pharmacy.placeId} style={styles.card}>
                                    <div style={styles.cardHeader}>
                                        <span style={styles.cardName}>{pharmacy.name}</span>
                                        <span style={styles.distancePill}>{formatDistance(pharmacy.distanceKm)}</span>
                                    </div>
                                    <p style={styles.cardMeta}>{pharmacy.address}</p>

                                    <div style={styles.cardBadgeRow}>
                                        {pharmacy.rating && <span style={styles.ratingBadge}>★ {pharmacy.rating}</span>}
                                        {pharmacy.openNow !== null && (
                                            <span
                                                style={{
                                                    ...styles.statusPill,
                                                    ...(pharmacy.openNow ? styles.statusPillOpen : styles.statusPillClosed),
                                                }}
                                            >
                                                {pharmacy.openNow ? 'Open now' : 'Closed'}
                                            </span>
                                        )}
                                    </div>

                                    <div style={styles.cardActions}>
                                        <a
                                            href={buildDirectionsLink(pharmacy, coords)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={styles.actionButton}
                                        >
                                            Directions
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleDetails(pharmacy.placeId)}
                                            style={styles.actionButtonSecondary}
                                        >
                                            {details?.expanded ? 'Hide hours & phone' : 'Show hours & phone'}
                                        </button>
                                    </div>

                                    {details?.expanded && (
                                        <div style={styles.detailsBox}>
                                            {details.loading && <p style={styles.detailsText}>Loading...</p>}
                                            {details.error && <p style={styles.detailsText}>{details.error}</p>}
                                            {!details.loading && !details.error && (
                                                <>
                                                    {details.phone && (
                                                        <p style={styles.detailsText}>
                                                            <a href={`tel:${details.phone}`} style={styles.phoneLink}>{details.phone}</a>
                                                        </p>
                                                    )}
                                                    {details.weekdayText && (
                                                        <ul style={styles.hoursList}>
                                                            {details.weekdayText.map((line, i) => (
                                                                <li key={i}>{line}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {!details.phone && !details.weekdayText && (
                                                        <p style={styles.detailsText}>No additional details available.</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
        height: 'fit-content',
    },
    title: { textAlign: 'center', fontSize: '28px', fontWeight: 'bold', marginBottom: '10px', color: '#333' },
    subtitle: { textAlign: 'center', fontSize: '16px', marginBottom: '25px', color: '#555' },
    form: { width: '100%' },
    formGroup: { marginBottom: '22px' },
    label: { display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '10px', fontSize: '15px' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold', color: '#333' },
    chipRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    locationButton: {
        width: '100%',
        padding: '14px',
        fontSize: '15px',
        fontWeight: 'bold',
        background: '#e8f5e9',
        color: '#2e7d32',
        border: '1.5px solid #a5d6a7',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    locationNote: { fontSize: '13px', color: '#2e7d32', marginTop: '8px' },
    orDivider: { fontSize: '13px', color: '#999', textAlign: 'center', margin: '12px 0' },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: '15px',
        fontSize: '16px',
        background: '#4caf50',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    error: { color: 'red', textAlign: 'center', marginTop: '10px', fontSize: '14px' },
    emptyState: {
        marginTop: '20px',
        padding: '16px',
        background: '#f0f4f8',
        border: '1px solid #dbe4ec',
        borderRadius: '8px',
        color: '#555',
        fontSize: '14px',
        textAlign: 'center',
    },
    results: { marginTop: '20px' },
    card: {
        background: '#fafafa',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '14px',
        textAlign: 'left',
    },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
    cardName: { fontSize: '17px', fontWeight: 'bold', color: '#333' },
    distancePill: {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#1565c0',
        background: '#e3f2fd',
        padding: '4px 10px',
        borderRadius: '12px',
        whiteSpace: 'nowrap',
    },
    cardMeta: { fontSize: '14px', color: '#666', margin: '4px 0' },
    cardBadgeRow: { display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' },
    ratingBadge: { fontSize: '13px', fontWeight: 'bold', color: '#a76a00', background: '#fff8e1', padding: '4px 10px', borderRadius: '12px' },
    statusPill: { fontSize: '13px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' },
    statusPillOpen: { color: '#2e7d32', background: '#e8f5e9' },
    statusPillClosed: { color: '#c62828', background: '#ffebee' },
    cardActions: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' },
    actionButton: {
        flex: '1 1 120px',
        textAlign: 'center',
        padding: '10px',
        background: '#4caf50',
        color: '#fff',
        borderRadius: '5px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    actionButtonSecondary: {
        flex: '1 1 160px',
        textAlign: 'center',
        padding: '10px',
        background: '#fff',
        color: '#4caf50',
        border: '1px solid #4caf50',
        borderRadius: '5px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    detailsBox: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' },
    detailsText: { fontSize: '14px', color: '#555', margin: '4px 0' },
    phoneLink: { color: '#4caf50', fontWeight: 'bold', textDecoration: 'none' },
    hoursList: { fontSize: '13px', color: '#666', paddingLeft: '18px', margin: '6px 0' },
};

export default FindPharmacy;
