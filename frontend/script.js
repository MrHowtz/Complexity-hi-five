document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('ecgCanvas');
    const ctx = canvas.getContext('2d');
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };

    // Dynamically resize the canvas to fit the screen width
    function resizeCanvas() {
        canvas.width = window.innerWidth - 40; // Adjust width to fit the viewport
        canvas.height = 400; // Keep height fixed
    }
    resizeCanvas();

    // Fetch and process the ECG data
    fetch('http://localhost:3000/api/observations')
        .then((response) => response.json())
        .then((data) => {
            console.log('Fetched data:', data);

            if (Array.isArray(data.entry)) {
                // Filter ECG data by LOINC code (85354-9 is for ECG)
                const ecgData = data.entry.filter((d) =>
                    d.resource.code.coding.some((c) => c.code === '85354-9')
                );

                // Process only the first 5 data points
                const firstFiveData = ecgData.slice(0, 5);

                // Extract times and values from the data
                const times = firstFiveData.map((d) =>
                    new Date(d.resource.effectiveDateTime).getTime()
                );
                const values = firstFiveData.map(
                    (d) => d.resource.valueQuantity.value
                );

                // Render the chart with the extracted data
                renderChart(times, values);
            } else {
                console.error('Expected an array in the "entry" property of the data.');
            }
        })
        .catch((error) => console.error('Error loading ECG data:', error));

    function renderChart(times, values) {
        if (times.length === 0 || values.length === 0) {
            console.error('No data available for rendering.');
            return;
        }

        // Clear the canvas for fresh rendering
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scales and axes ranges
        const { xScale, yScale, xTicks, yTicks } = calculateScales(times, values);

        drawAxes(xScale, yScale, xTicks, yTicks, times, values); // Pass times/values explicitly
        drawLineChart(xScale, yScale, times, values);
        drawDataPoints(xScale, yScale, times, values);
    }

    function calculateScales(times, values) {
        const xMin = Math.min(...times);
        const xMax = Math.max(...times);
        const yMin = Math.min(...values);
        const yMax = Math.max(...values);

        const xScale = (time) =>
            margin.left +
            ((time - xMin) / (xMax - xMin)) * (canvas.width - margin.left - margin.right);
        const yScale = (value) =>
            canvas.height -
            margin.bottom -
            ((value - yMin) / (yMax - yMin)) * (canvas.height - margin.top - margin.bottom);

        // Generate ticks for axes
        const xTicks = times.map((t) => new Date(t).toLocaleTimeString());
        const yTicks = Array.from(
            { length: 5 },
            (_, i) => yMin + (i * (yMax - yMin)) / 4
        );

        return { xScale, yScale, xTicks, yTicks };
    }

    function drawAxes(xScale, yScale, xTicks, yTicks, times, values) {
        // Draw X-Axis
        ctx.beginPath();
        ctx.moveTo(margin.left, canvas.height - margin.bottom);
        ctx.lineTo(canvas.width - margin.right, canvas.height - margin.bottom);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Y-Axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, canvas.height - margin.bottom);
        ctx.stroke();

        // Draw X-Axis Labels (Time)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        xTicks.forEach((label, i) => {
            const x = xScale(times[i]);
            if (x > margin.left && x < canvas.width - margin.right) {
                ctx.fillText(label, x, canvas.height - margin.bottom + 10);
            }
        });

        // Draw Y-Axis Labels (Values)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        yTicks.forEach((label) => {
            const y = yScale(label);
            ctx.fillText(label.toFixed(2), margin.left - 10, y);
        });
    }

    function drawLineChart(xScale, yScale, times, values) {
        ctx.beginPath();
        ctx.moveTo(xScale(times[0]), yScale(values[0]));

        for (let i = 1; i < times.length; i++) {
            ctx.lineTo(xScale(times[i]), yScale(values[i]));
        }

        ctx.strokeStyle = 'steelblue';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawDataPoints(xScale, yScale, times, values) {
        ctx.fillStyle = 'red';
        for (let i = 0; i < times.length; i++) {
            const x = xScale(times[i]);
            const y = yScale(values[i]);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Update canvas and re-fetch data on window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        fetch('http://localhost:3000/api/observations')
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data.entry)) {
                    const ecgData = data.entry.filter((d) =>
                        d.resource.code.coding.some((c) => c.code === '85354-9')
                    );
                    const firstFiveData = ecgData.slice(0, 5);
                    const times = firstFiveData.map((d) =>
                        new Date(d.resource.effectiveDateTime).getTime()
                    );
                    const values = firstFiveData.map(
                        (d) => d.resource.valueQuantity.value
                    );
                    renderChart(times, values);
                }
            })
            .catch((error) => console.error('Error loading data during resize:', error));
    });
});
