// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const ecgDataPath = path.join(__dirname, '..', 'output', 'fhir_observations.json');
const dataDir = path.join(__dirname, '..', 'data');
const pythonScriptPath = path.join(__dirname, '..', 'scripts', 'process_ecg.py'); // Updated path to the script

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors());

// Function to clear all files from the data directory except the newly uploaded file
function clearDataFolder(excludeFile) {
    fs.readdir(dataDir, (err, files) => {
        if (err) {
            console.error('Error reading data directory:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(dataDir, file);
            // Only delete files that are NOT the newly uploaded file
            if (file !== excludeFile) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Error deleting file: ${file}`, err);
                    } else {
                        console.log(`Deleted file: ${file}`);
                    }
                });
            }
        });
    });
}

// Set up multer for file uploads and save with original filename
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, dataDir);
    },
    filename: function (req, file, cb) {
        // Ensure the uploaded file keeps its original name and extension
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Function to extract seconds from effectiveDateTime
function extractSeconds(dateTime) {
    const match = dateTime.match(/T.*:(\d{2})(?:\.\d+)?/);
    return match ? parseInt(match[1], 10) : null;
}

// REST API endpoint to fetch relevant ECG data for the graph
app.get('/api/observations', (req, res) => {
    fs.readFile(ecgDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Unable to read ECG data.' });
        }

        try {
            const ecgData = JSON.parse(data);

            const filteredData = ecgData.map((d, index) => ({
                time: index,
                value: d.valueQuantity.value,
                seconds: extractSeconds(d.effectiveDateTime),
            }));

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

// Endpoint to upload an .h5 file
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Clean the folder but exclude the newly uploaded file from deletion
        clearDataFolder(req.file.originalname);

        console.log(`File uploaded: ${req.file.originalname}`);

        // Trigger the Python script to process the uploaded file
        exec(`python "${pythonScriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing script:', error);
                return res.status(500).json({ error: 'Failed to process file.' });
            }
            if (stderr) {
                console.error('Script stderr:', stderr);
                return res.status(500).json({ error: 'Error in script execution.' });
            }

            console.log('Script output:', stdout);
            res.json({ message: 'File uploaded and processed successfully.' });
        });

    } catch (err) {
        console.error('Error handling upload:', err);
        res.status(500).json({ error: 'Failed to upload file.' });
    }
});

// Endpoint to trigger the processing of the uploaded file
app.get('/api/process', (req, res) => {
    exec(`python "${pythonScriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing script:', error);
            return res.status(500).json({ error: 'Failed to process file.' });
        }
        if (stderr) {
            console.error('Script stderr:', stderr);
            return res.status(500).json({ error: 'Error in script execution.' });
        }

        console.log('Script output:', stdout);
        res.json({ message: 'File processed successfully.' });
    });
});

// Create WebSocket server for real-time ECG data streaming
const wss = new WebSocket.Server({ noServer: true });

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
                    time: index,
                    value: d.valueQuantity.value,
                    seconds: extractSeconds(d.effectiveDateTime),
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
});
