const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');  // Ensure this file exists
require('dotenv').config(); 

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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


app.post('/symptoms', async (req, res) => {
    const { symptoms, duration, severity, factors, ageGroup } = req.body;

    if (!symptoms || !duration || !severity || !ageGroup) {
        return res.status(400).json({ error: "All required fields must be filled." });
    }

    try {
        // ✅ Prepare the AI prompt
        const userPrompt = `A patient is experiencing the following symptoms: ${symptoms}.
        Duration: ${duration}. Severity: ${severity}.
        Additional factors: ${factors.length > 0 ? factors.join(", ") : "None"}.
        Age group: ${ageGroup}. 

        Based on this information:
        - What are possible medical conditions?
        - What steps should the person take?
        - Should they consult a doctor immediately?`;

        // ✅ Call the Google Gemini API with the corrected model
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
            {
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            },
            { headers: { "Content-Type": "application/json" } }
        );

        // ✅ Extract AI-generated response
        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        res.json({ analysis: aiResponse });

    } catch (error) {
        console.error("❌ Error calling Gemini API:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch AI analysis. Please try again later." });
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