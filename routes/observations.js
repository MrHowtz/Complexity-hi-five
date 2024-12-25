const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// JSON file path for processed ECG data
const ecgDataPath = path.join(__dirname, '..', '..', 'output', 'fhir_observations.json');

// REST API endpoint to fetch all historical ECG data
router.get('/', (req, res) => {
    fs.readFile(ecgDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Unable to read ECG data.' });
        }
        res.json(JSON.parse(data));
    });
});

module.exports = router;
