// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// JSON file path for processed ECG data (GitHub Codespaces compatible)
const ecgDataPath = path.join(__dirname, '..', 'output', 'fhir_observations.json');

// Middleware to parse JSON
app.use(express.json());

// REST API endpoint to fetch all historical ECG data
app.get('/api/observations', (req, res) => {
    fs.readFile(ecgDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Unable to read ECG data.' });
        }
        res.json(JSON.parse(data));
    });
});

// Create WebSocket server for real-time ECG data streaming
const wss = new WebSocket.Server({ noServer: true });

// Simulate real-time streaming
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    // Stream data at 1 reading per second
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
                ws.send(JSON.stringify(ecgData[index]));
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
// Import routes
const observationsRouter = require('./routes/observations');

// Use the observations route
app.use('/api/observations', observationsRouter);

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Service is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
});