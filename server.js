const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in .env file');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Contribution Schema
const contributionSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true },
    xrpAmount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Contribution = mongoose.model('Contribution', contributionSchema);

// API to record contribution
app.post('/api/contribute', async (req, res) => {
    try {
        const { walletAddress, xrpAmount } = req.body;
        if (!walletAddress || !xrpAmount || xrpAmount <= 0) {
            return res.status(400).json({ error: 'Invalid wallet address or XRP amount' });
        }
        const contribution = new Contribution({ walletAddress, xrpAmount });
        await contribution.save();
        res.status(201).json({ message: 'Contribution recorded' });
    } catch (error) {
        console.error('Contribution error:', error);
        res.status(500).json({ error: 'Failed to record contribution' });
    }
});

// API to get all contributions
app.get('/api/contributions', async (req, res) => {
    try {
        const contributions = await Contribution.find();
        const totalXRP = contributions.reduce((sum, c) => sum + c.xrpAmount, 0);
        res.json({ totalXRP, contributions });
    } catch (error) {
        console.error('Fetch contributions error:', error);
        res.status(500).json({ error: 'Failed to fetch contributions' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));