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
- Even when urgency is high, stay calm and clear - state plainly what to do next rather than emphasizing danger.
- Frame the whole response as "here's what this probably is, and what to do about it," not a list of diseases to worry about.
- Only include a condition in possibleConditions if it is a plausible explanation given the input - the list should feel reassuringly ordinary, not exhaustively worst-case.

Always respond by calling the provide_symptom_analysis tool.`;

app.post('/symptoms', async (req, res) => {
    const { symptoms, duration, severity, ageGroup } = req.body;
    const factors = Array.isArray(req.body.factors) ? req.body.factors : [];

    if (!symptoms || !duration || !severity || !ageGroup) {
        return res.status(400).json({ error: "All required fields must be filled." });
    }

    try {
        const userPrompt = `A patient reports:
- Symptoms: ${symptoms}
- Duration: ${duration}
- Severity: ${severity}
- Additional factors: ${factors.length > 0 ? factors.join(", ") : "None"}
- Age group: ${ageGroup}

Provide a calm, reassuring symptom analysis by calling the provide_symptom_analysis tool.`;

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



// ✅ Find Pharmacies Route
app.post('/find-pharmacies', async (req, res) => {
    const { city, openNow, minRating } = req.body;

    if (!city) {
        return res.status(400).json({ error: 'City is required.' });
    }

    try {
        const geoResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: { address: city, key: GOOGLE_MAPS_API_KEY },
        });

        if (!geoResponse.data.results.length) {
            return res.status(404).json({ error: 'City not found.' });
        }

        const { lat, lng } = geoResponse.data.results[0].geometry.location;

        const placesResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
            params: {
                location: `${lat},${lng}`,
                radius: 5000,
                type: 'pharmacy',
                key: GOOGLE_MAPS_API_KEY,
                open_now: openNow || false,
            },
        });

        if (!placesResponse.data.results.length) {
            return res.status(404).json({ error: 'No pharmacies found.' });
        }

        const pharmacies = placesResponse.data.results.map((place) => ({
            name: place.name,
            address: place.vicinity || 'Not Available',
            rating: place.rating || 'No Rating',
            openNow: place.opening_hours?.open_now ? 'Open Now' : 'Closed',
            googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}`,
        }));

        res.json(pharmacies);
    } catch (error) {
        console.error('❌ Error fetching pharmacies:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch pharmacy data. Try again later.' });
    }
});

// ✅ Search Doctors Route
app.post('/search-doctors', async (req, res) => {
    const { city, specialty, urgency } = req.body;

    if (!city || !specialty) {
        return res.status(400).json({ error: 'City and specialty are required.' });
    }

    try {
        console.log("Searching for city:", city);

        const geoResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: { address: city, key: GOOGLE_MAPS_API_KEY },
        });

        if (!geoResponse.data.results.length) {
            return res.status(404).json({ error: 'City not found.' });
        }

        const { lat, lng } = geoResponse.data.results[0].geometry.location;
        let searchKeyword = specialty;
        if (urgency === 'urgent') searchKeyword += ' urgent care';
        else if (urgency === 'emergency') searchKeyword += ' emergency hospital';

        const placesResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
            params: {
                location: `${lat},${lng}`,
                radius: 5000,
                keyword: searchKeyword,
                type: 'doctor',
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        if (!placesResponse.data.results.length) {
            return res.status(404).json({ error: 'No doctors found matching your criteria.' });
        }

        const doctors = placesResponse.data.results.map((place) => ({
            name: place.name,
            specialty: specialty.charAt(0).toUpperCase() + specialty.slice(1),
            address: place.vicinity || 'Not Available',
            rating: place.rating || 'No Rating',
            googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}`,
        }));

        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch doctor data. Try again later.' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
}); 