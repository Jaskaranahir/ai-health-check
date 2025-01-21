const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests

// Default Route (Root)
app.get('/', (req, res) => {
    res.send('Welcome to the AI Health Symptom Checker API!');
});

// Symptoms API Endpoint
app.post('/symptoms', (req, res) => {
    const { symptoms } = req.body; // Get symptoms from the request body
    console.log('Received symptoms:', symptoms);

    // Dummy response (replace this with actual AI integration)
    const response = {
        message: 'Symptoms received successfully!',
        conditions: ['Common Cold', 'Flu', 'COVID-19'],
        advice: 'Stay hydrated and rest. Consult a doctor if symptoms persist.'
    };

    res.json(response); // Send the dummy response back to the client
});

// 404 Error Handler for Undefined Routes
app.use((req, res) => {
    res.status(404).send('Route not found');
});

// Start the Server
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
