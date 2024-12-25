const apiUrl = 'http://127.0.0.1:5000/api/heart-data';
const uploadUrl = 'http://127.0.0.1:5000/upload';

let chartInstance = null; // Variable to store the current chart instance

document.getElementById('uploadButton').addEventListener('click', handleFileUpload);

async function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Please select a file!');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Send the file to the server
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            alert(`Error: ${data.error}`);
            return;
        }

        renderChart(data.heart_rate);
        renderAnalysis(data.analysis);
    } catch (error) {
        console.error('Error during file upload:', error); // Debugging
        alert(`An error occurred: ${error.message}`);
    }
}

async function fetchHeartData() {
    try {
        // Fetch default heart rate data
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                heart_rate: [72, 75, 73, 80, 78, 76],
            }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        renderChart([72, 75, 73, 80, 78, 76]); // Render the chart
        renderAnalysis(data.analysis); // Render textual analysis
    } catch (error) {
        console.error('Error during fetching data:', error); // Debugging
        alert(`An error occurred: ${error.message}`);
    }
}

function renderChart(heartRate) {
    const ctx = document.getElementById('heartChart').getContext('2d');

    // Destroy the existing chart if any
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Create a new chart and store it in the variable
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: heartRate.map((_, i) => `Point ${i + 1}`),
            datasets: [{
                label: 'Heart Rate',
                data: heartRate,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderAnalysis(analysis) {
    const analysisDiv = document.getElementById('analysis');
    analysisDiv.innerHTML = `
        <h3>Analysis</h3>
        <p>${analysis.message}</p>
    `;
}

// Fetch default heart rate data when the page loads
document.addEventListener('DOMContentLoaded', fetchHeartData);
