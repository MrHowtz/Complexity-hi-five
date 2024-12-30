// Mock Data (FHIR format)
const mockData = [
    { effectiveDateTime: "2024-12-30T10:00:00Z", valueQuantity: { value: 0.5 } },
    { effectiveDateTime: "2024-12-30T10:01:00Z", valueQuantity: { value: 0.7 } },
    { effectiveDateTime: "2024-12-30T10:02:00Z", valueQuantity: { value: 0.9 } },
    { effectiveDateTime: "2024-12-30T10:03:00Z", valueQuantity: { value: 0.8 } },
    { effectiveDateTime: "2024-12-30T10:04:00Z", valueQuantity: { value: 0.6 } },
];

// Select the canvas and context
const canvas = document.getElementById('ecgCanvas');
const ctx = canvas.getContext('2d');

// Dimensions and margins
const width = canvas.width;
const height = canvas.height;
const margin = { top: 20, right: 20, bottom: 30, left: 50 };

// Prepare the data
const times = mockData.map(d => new Date(d.effectiveDateTime).getTime());
const values = mockData.map(d => d.valueQuantity.value);

// Calculate scale
const xMin = Math.min(...times);
const xMax = Math.max(...times);
const yMin = Math.min(...values);
const yMax = Math.max(...values);

// Scale functions
const xScale = time => margin.left + ((time - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
const yScale = value => height - margin.bottom - ((value - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);

// Draw axes
function drawAxes() {
    // X-Axis
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Y-Axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // X-Axis Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xLabels = mockData.map(d => new Date(d.effectiveDateTime).toLocaleTimeString());
    xLabels.forEach((label, i) => {
        const x = xScale(times[i]);
        ctx.fillText(label, x, height - margin.bottom + 5);
    });

    // Y-Axis Labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = Math.floor(yMin); i <= Math.ceil(yMax); i += 0.1) {
        const y = yScale(i);
        ctx.fillText(i.toFixed(1), margin.left - 5, y);
    }
}

// Draw line chart
function drawLineChart() {
    ctx.beginPath();
    ctx.moveTo(xScale(times[0]), yScale(values[0]));

    for (let i = 1; i < times.length; i++) {
        ctx.lineTo(xScale(times[i]), yScale(values[i]));
    }

    ctx.strokeStyle = 'steelblue';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Draw data points
function drawDataPoints() {
    ctx.fillStyle = 'red';
    for (let i = 0; i < times.length; i++) {
        const x = xScale(times[i]);
        const y = yScale(values[i]);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// Render the chart
function renderChart() {
    drawAxes();
    drawLineChart();
    drawDataPoints();
}

// Execute the render function
renderChart();