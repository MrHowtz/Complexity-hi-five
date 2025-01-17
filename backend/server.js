// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const cors = require('cors'); // Added for CORS support

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// JSON file path for processed ECG data
const ecgDataPath = path.join(__dirname, '..', 'output', 'fhir_observations.json');

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Function to extract seconds from effectiveDateTime
function extractSeconds(dateTime) {
    const match = dateTime.match(/T.*:(\d{2})(?:\.\d+)?/); // Regex to capture seconds part
    return match ? parseInt(match[1], 10) : null; // Return seconds as an integer
}

// REST API endpoint to fetch relevant ECG data for the graph (time, value, and seconds)
app.get('/api/observations', (req, res) => {
    fs.readFile(ecgDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Unable to read ECG data.' });
        }

        try {
            const ecgData = JSON.parse(data);

            // Map and filter the data to include time, value, and seconds
            const filteredData = ecgData.map((d, index) => ({
                time: index, // Use the index as the time value
                value: d.valueQuantity.value, // ECG value in mV
                seconds: extractSeconds(d.effectiveDateTime), // Extracted seconds from effectiveDateTime
            }));

            // Log the filtered data before sending it
            console.log("Filtered Data:", filteredData);

            res.json(filteredData);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(500).json({ error: 'Error parsing ECG data.' });
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Service is running' });
});

// Create WebSocket server for real-time ECG data streaming
const wss = new WebSocket.Server({ noServer: true });

// Simulate real-time streaming
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    let intervalId;
    fs.readFile(ecgDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            ws.send(JSON.stringify({ error: 'Unable to read ECG data.' }));
            return;
        }

        const ecgData = JSON.parse(data);
        let index = 0;

        intervalId = setInterval(() => {
            if (index < ecgData.length) {
                const d = ecgData[index];
                ws.send(JSON.stringify({
                    time: index, // Use the index as the time value
                    value: d.valueQuantity.value, // ECG value in mV
                    seconds: extractSeconds(d.effectiveDateTime), // Extracted seconds
                }));
                index++;
            } else {
                clearInterval(intervalId);
                ws.close();
            }
        }, 1000); // 1 reading per second
    });

    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        clearInterval(intervalId);
    });
});

// Upgrade HTTP server to handle WebSocket connections
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Error handling middleware (must come after all other handlers)
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
});
