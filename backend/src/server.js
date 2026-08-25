const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const Anthropic = require('@anthropic-ai/sdk');
const User = require('../models/User');  // Ensure this file exists
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));



 // ✅ User History Schema (Stores Dashboard Data)
const UserHistorySchema = new mongoose.Schema({
    email: { type: String, required: true },
    symptoms: [String],
    doctors: [String],
    pharmacies: [String],
});

const UserHistory = mongoose.model('UserHistory', UserHistorySchema);
  




// ✅ Default Route
app.get('/', (req, res) => {
    res.send('Welcome to the AI Health Symptom Checker API!');
});




// ✅ Create User Account (Sign-Up)
app.post('/create-account', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // ✅ Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        // ✅ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Save user to database
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ✅ Login User with JWT Authentication
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // ✅ Find user in database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // ✅ Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // ✅ Generate JWT Token
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful!', token, email: user.email });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});



// ✅ Save Symptoms to User History
app.post('/save-symptoms', async (req, res) => {
    const { email, symptoms } = req.body;

    try {
        let userHistory = await UserHistory.findOne({ email });

        if (!userHistory) {
            userHistory = new UserHistory({ email, symptoms: [], doctors: [], pharmacies: [] });
        }

        userHistory.symptoms.push(symptoms);
        await userHistory.save();

        res.status(200).json({ message: 'Symptoms saved successfully.' });
    } catch (error) {
        console.error('Error saving symptoms:', error);
        res.status(500).json({ error: 'Failed to save symptoms.' });
    }
});

// ✅ Save Doctor Search to User History
app.post('/save-doctor-search', async (req, res) => {
    const { email, doctorName } = req.body;

    try {
        let userHistory = await UserHistory.findOne({ email });

        if (!userHistory) {
            userHistory = new UserHistory({ email, symptoms: [], doctors: [], pharmacies: [] });
        }

        userHistory.doctors.push(doctorName);
        await userHistory.save();

        res.status(200).json({ message: 'Doctor search saved successfully.' });
    } catch (error) {
        console.error('Error saving doctor search:', error);
        res.status(500).json({ error: 'Failed to save doctor search.' });
    }
});

// ✅ Save Pharmacy Search to User History
app.post('/save-pharmacy-search', async (req, res) => {
    const { email, pharmacyName } = req.body;

    try {
        let userHistory = await UserHistory.findOne({ email });

        if (!userHistory) {
            userHistory = new UserHistory({ email, symptoms: [], doctors: [], pharmacies: [] });
        }

        userHistory.pharmacies.push(pharmacyName);
        await userHistory.save();

        res.status(200).json({ message: 'Pharmacy search saved successfully.' });
    } catch (error) {
        console.error('Error saving pharmacy search:', error);
        res.status(500).json({ error: 'Failed to save pharmacy search.' });
    }
});

// ✅ Fetch User History for Dashboard
app.get('/user-history', async (req, res) => {
    const { email } = req.query;

    try {
        const history = await UserHistory.findOne({ email }) || { symptoms: [], doctors: [], pharmacies: [] };
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history.' });
    }
});


// ✅ Tool definition forcing a calm, structured symptom analysis out of Claude
const SYMPTOM_ANALYSIS_TOOL = {
    name: 'provide_symptom_analysis',
    description: "Provide a calm, structured, reassuring analysis of a patient's described symptoms.",
    strict: true,
    input_schema: {
        type: 'object',
        properties: {
            overallUrgency: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'How urgently the person should seek medical care, based only on what genuinely warrants it.',
            },
            disclaimer: {
                type: 'string',
                description: 'A brief, calm safety note: this is not a diagnosis, and to seek emergency care for a genuine emergency.',
            },
            possibleConditions: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        condition: { type: 'string' },
                        likelihood: { type: 'string', enum: ['low', 'moderate', 'high'] },
                        explanation: { type: 'string' },
                    },
                    required: ['condition', 'likelihood', 'explanation'],
                    additionalProperties: false,
                },
                description: '2 to 4 everyday explanations ordered from most to least likely - never ordered by severity, and never led with rare or frightening diagnoses.',
            },
            selfCareSteps: {
                type: 'array',
                items: { type: 'string' },
                description: 'Calm, practical things the person can do at home, when appropriate.',
            },
            whenToSeeADoctor: {
                type: 'array',
                items: { type: 'string' },
                description: 'Clear, specific signs that mean it is time to see a doctor.',
            },
        },
        required: ['overallUrgency', 'disclaimer', 'possibleConditions', 'selfCareSteps', 'whenToSeeADoctor'],
        additionalProperties: false,
    },
};

const SYMPTOM_ANALYSIS_SYSTEM_PROMPT = `You are a calm, reassuring health assistant inside a symptom-checker app. Your defining trait is that you do NOT scare people, unlike typical symptom checkers that jump straight to worst-case diagnoses.

Follow these rules:
- Always list the most common, everyday explanations first. Order possibleConditions from most likely to least likely - never from most to least severe, and never lead with a rare or alarming condition.
- Use warm, plain, non-alarming language, like a calm, experienced nurse reassuring a worried friend. Avoid clinical jargon and dramatic phrasing ("could be fatal", "serious risk of...") unless the situation genuinely warrants it.
- Default toward "low" overallUrgency for everyday symptoms. Only raise it to "medium" or "high" when the described duration, severity, and factors genuinely warrant it.
- Weigh onset, progression, and associated symptoms as real clinical signals: sudden onset, symptoms that are getting worse, or red-flag associated symptoms (e.g. chest pain, fainting, unusual bleeding, numbness/weakness, vision changes) can justify raising urgency even for an otherwise common complaint.
- Even when urgency is high, stay calm and clear - state plainly what to do next rather than emphasizing danger.
- Frame the whole response as "here's what this probably is, and what to do about it," not a list of diseases to worry about.
- Only include a condition in possibleConditions if it is a plausible explanation given the input - the list should feel reassuringly ordinary, not exhaustively worst-case.

Always respond by calling the provide_symptom_analysis tool.`;

app.post('/symptoms', async (req, res) => {
    const { symptoms, duration, severity, ageGroup, location, onset, progression, betterOrWorse, additionalNotes } = req.body;
    const associatedSymptoms = Array.isArray(req.body.associatedSymptoms) ? req.body.associatedSymptoms : [];

    if (!symptoms || !duration || !severity || !ageGroup || !onset || !progression) {
        return res.status(400).json({ error: "All required fields must be filled." });
    }

    try {
        const formatEnum = (value) => (value ? String(value).replace(/_/g, ' ') : '');

        const userPrompt = [
            'A patient reports:',
            `- Symptoms: ${symptoms}`,
            location ? `- Location: ${formatEnum(location)}` : null,
            `- Onset: ${formatEnum(onset)}`,
            `- Duration: ${formatEnum(duration)}`,
            `- Severity: ${severity}`,
            `- Progression: ${formatEnum(progression)}`,
            associatedSymptoms.length > 0 ? `- Associated symptoms: ${associatedSymptoms.map(formatEnum).join(', ')}` : null,
            betterOrWorse ? `- What makes it better or worse: ${betterOrWorse}` : null,
            `- Age group: ${ageGroup}`,
            additionalNotes ? `- Additional notes from the patient: ${additionalNotes}` : null,
            '',
            'Provide a calm, reassuring symptom analysis by calling the provide_symptom_analysis tool.',
        ].filter((line) => line !== null).join('\n');

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-5',
            max_tokens: 2048,
            system: SYMPTOM_ANALYSIS_SYSTEM_PROMPT,
            tools: [SYMPTOM_ANALYSIS_TOOL],
            tool_choice: { type: 'tool', name: 'provide_symptom_analysis' },
            messages: [{ role: 'user', content: userPrompt }],
        });

        const toolUseBlock = response.content.find((block) => block.type === 'tool_use');

        if (!toolUseBlock) {
            console.error('❌ Claude response had no tool_use block:', response);
            return res.status(502).json({ error: 'Failed to generate a structured analysis. Please try again.' });
        }

        res.json(toolUseBlock.input);

    } catch (error) {
        if (error instanceof Anthropic.RateLimitError) {
            console.error('❌ Claude rate limit exceeded:', error.message);
            return res.status(429).json({ error: 'Our AI analysis is a bit busy right now. Please try again in a moment.' });
        }
        if (error instanceof Anthropic.AuthenticationError) {
            console.error('❌ Claude authentication error - check ANTHROPIC_API_KEY:', error.message);
            return res.status(500).json({ error: 'AI analysis is temporarily unavailable. Please try again later.' });
        }
        if (error instanceof Anthropic.APIError) {
            console.error('❌ Claude API error:', error.status, error.message);
            return res.status(502).json({ error: 'Failed to fetch AI analysis. Please try again later.' });
        }
        console.error('❌ Unexpected error calling Claude:', error);
        res.status(500).json({ error: 'Failed to fetch AI analysis. Please try again later.' });
    }
});



// ✅ Shared helpers for location search (pharmacies + doctors)

function searchError(statusCode, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

// Resolve a search origin from either an explicit lat/lng (from browser geolocation)
// or a city name (geocoded as a fallback). Geolocation skips geocoding entirely,
// which removes the biggest source of "city not found"/ambiguous-match failures.
async function resolveOrigin({ city, lat, lng }) {
    if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng };
    }

    if (!city) {
        return null;
    }

    const geoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address: city, key: GOOGLE_MAPS_API_KEY },
    });

    if (geoResponse.data.status === 'ZERO_RESULTS') {
        throw searchError(404, "We couldn't find that city. Try a different spelling or a nearby larger city.");
    }
    if (geoResponse.data.status !== 'OK') {
        console.error('❌ Geocoding error:', geoResponse.data.status, geoResponse.data.error_message);
        throw searchError(502, 'Location lookup is temporarily unavailable. Please try again later.');
    }

    const { lat: gLat, lng: gLng } = geoResponse.data.results[0].geometry.location;
    return { lat: gLat, lng: gLng };
}

// Progressively widen the search radius instead of failing hard on a low-density area.
const SEARCH_RADII_METERS = [5000, 15000, 40000];

async function nearbySearchWithWidening(origin, placesParams) {
    for (const radius of SEARCH_RADII_METERS) {
        const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
                location: `${origin.lat},${origin.lng}`,
                radius,
                key: GOOGLE_MAPS_API_KEY,
                ...placesParams,
            },
        });

        const status = placesResponse.data.status;

        // Google's Places API always returns a status, even on HTTP 200 - an empty
        // `results` array on a quota/auth/request error looks identical to a truly
        // empty area unless this is checked explicitly.
        if (status === 'OK') {
            return { results: placesResponse.data.results, radiusMeters: radius };
        }
        if (status !== 'ZERO_RESULTS') {
            console.error('❌ Places API error:', status, placesResponse.data.error_message);
            throw searchError(502, 'Location search is temporarily unavailable. Please try again later.');
        }
        // ZERO_RESULTS -> try the next, larger radius tier.
    }

    return { results: [], radiusMeters: SEARCH_RADII_METERS[SEARCH_RADII_METERS.length - 1] };
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ✅ Find Pharmacies Route
app.post('/find-pharmacies', async (req, res) => {
    const { city, lat, lng, openNow, minRating } = req.body;

    try {
        const origin = await resolveOrigin({ city, lat, lng });
        if (!origin) {
            return res.status(400).json({ error: 'Enter a city, or allow location access.' });
        }

        const { results: places, radiusMeters } = await nearbySearchWithWidening(origin, {
            type: 'pharmacy',
            ...(openNow ? { opennow: true } : {}),
        });

        let pharmacies = places.map((place) => ({
            placeId: place.place_id,
            name: place.name,
            address: place.vicinity || 'Not Available',
            rating: place.rating || null,
            openNow: typeof place.opening_hours?.open_now === 'boolean' ? place.opening_hours.open_now : null,
            distanceKm: Math.round(haversineKm(origin.lat, origin.lng, place.geometry.location.lat, place.geometry.location.lng) * 10) / 10,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
        }));

        if (minRating) {
            pharmacies = pharmacies.filter((p) => (p.rating || 0) >= Number(minRating));
        }

        pharmacies.sort((a, b) => a.distanceKm - b.distanceKm);

        res.json({ results: pharmacies, searchRadiusKm: radiusMeters / 1000, origin });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('❌ Error fetching pharmacies:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch pharmacy data. Try again later.' });
    }
});

// ✅ Search Doctors Route
app.post('/search-doctors', async (req, res) => {
    const { city, lat, lng, specialty, urgency, openNow, minRating } = req.body;

    if (!specialty) {
        return res.status(400).json({ error: 'Specialty is required.' });
    }

    // A real emergency shouldn't be routed into a business-listing search - the
    // frontend handles this by showing an emergency panel instead of calling this
    // endpoint at all; this is a defense-in-depth guard, not the primary control.
    if (urgency === 'emergency') {
        return res.status(400).json({ error: 'For emergencies, please contact emergency services directly rather than searching.' });
    }

    try {
        const origin = await resolveOrigin({ city, lat, lng });
        if (!origin) {
            return res.status(400).json({ error: 'Enter a city, or allow location access.' });
        }

        const searchKeyword = urgency === 'urgent' ? `${specialty} urgent care` : specialty;

        const { results: places, radiusMeters } = await nearbySearchWithWidening(origin, {
            keyword: searchKeyword,
            type: 'doctor',
            ...(openNow ? { opennow: true } : {}),
        });

        let doctors = places.map((place) => ({
            placeId: place.place_id,
            name: place.name,
            specialty: specialty.charAt(0).toUpperCase() + specialty.slice(1),
            address: place.vicinity || 'Not Available',
            rating: place.rating || null,
            openNow: typeof place.opening_hours?.open_now === 'boolean' ? place.opening_hours.open_now : null,
            distanceKm: Math.round(haversineKm(origin.lat, origin.lng, place.geometry.location.lat, place.geometry.location.lng) * 10) / 10,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
        }));

        if (minRating) {
            doctors = doctors.filter((d) => (d.rating || 0) >= Number(minRating));
        }

        doctors.sort((a, b) => a.distanceKm - b.distanceKm);

        res.json({ results: doctors, searchRadiusKm: radiusMeters / 1000, origin });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('❌ Error fetching doctors:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch doctor data. Try again later.' });
    }
});

// ✅ Lazy-loaded details (hours + phone) for a single place, fetched on demand
// per-card rather than eagerly for every search result to keep searches fast
// and avoid an N+1 Place Details call per result.
app.get('/place-details', async (req, res) => {
    const { placeId } = req.query;

    if (!placeId) {
        return res.status(400).json({ error: 'placeId is required.' });
    }

    try {
        const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
                place_id: placeId,
                fields: 'formatted_phone_number,opening_hours',
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        if (detailsResponse.data.status !== 'OK') {
            console.error('❌ Place Details error:', detailsResponse.data.status, detailsResponse.data.error_message);
            return res.status(502).json({ error: 'Failed to fetch details for this location.' });
        }

        const result = detailsResponse.data.result || {};
        res.json({
            phone: result.formatted_phone_number || null,
            weekdayText: result.opening_hours?.weekday_text || null,
        });
    } catch (error) {
        console.error('❌ Error fetching place details:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch details. Please try again later.' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
}); 