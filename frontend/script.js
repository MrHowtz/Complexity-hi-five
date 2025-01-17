document.addEventListener('DOMContentLoaded', function () {
    const apiEndpoint = 'http://localhost:3000/api/observations';
    const uploadEndpoint = 'http://localhost:3000/api/upload';

    // Handle file upload
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');

    uploadForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            uploadStatus.textContent = 'Please select a file.';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        uploadStatus.textContent = 'Uploading...';

        fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Upload failed');
                }
                return response.json();
            })
            .then((data) => {
                uploadStatus.textContent = 'File uploaded successfully!';
                fetchAndRenderECGData(); // Refresh the chart and table
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
                uploadStatus.textContent = 'Error uploading file.';
            });
    });

    // Fetch ECG data and render the chart
    function fetchAndRenderECGData() {
        fetch(apiEndpoint)
            .then((response) => response.json())
            .then((data) => {
                console.log('Fetched data:', data);

                const uniqueData = [];
                const seenSeconds = new Set();

                data.forEach((d) => {
                    const seconds = d.seconds;
                    if (!seenSeconds.has(seconds)) {
                        seenSeconds.add(seconds);
                        uniqueData.push(d);
                    }
                });

                const values = uniqueData.map((d) => d.value);
                const seconds = uniqueData.map((d) => d.seconds);

                renderChart(seconds, values);
                populateTable(uniqueData);
            })
            .catch((error) => console.error('Error loading ECG data:', error));
    }

    function renderChart(seconds, values) {
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        d3.select('#chart').selectAll('*').remove();

        const svg = d3
            .select('#chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3
            .scaleLinear()
            .domain([d3.min(seconds), d3.max(seconds)])
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain([d3.min(values), d3.max(values)])
            .range([height, 0]);

        const xAxis = d3.axisBottom(xScale).ticks(seconds.length);
        const yAxis = d3.axisLeft(yScale).ticks(5);

        svg
            .append('g')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text('Time (Seconds)');

        svg
            .append('g')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -40)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text('ECG Value (mV)');

        const line = d3
            .line()
            .x((_, i) => xScale(seconds[i]))
            .y((d) => yScale(d));

        svg
            .append('path')
            .datum(values)
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 2)
            .attr('d', line);

        svg
            .selectAll('circle')
            .data(values)
            .enter()
            .append('circle')
            .attr('cx', (_, i) => xScale(seconds[i]))
            .attr('cy', (d) => yScale(d))
            .attr('r', 4)
            .attr('fill', 'red')
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5);
    }

    function populateTable(data) {
        const tableBody = document.querySelector('#ecgTable tbody');
        tableBody.innerHTML = '';

        data.forEach((d, index) => {
            const row = document.createElement('tr');
            const indexCell = document.createElement('td');
            const valueCell = document.createElement('td');

            indexCell.textContent = index;
            valueCell.textContent = d.value;

            row.appendChild(indexCell);
            row.appendChild(valueCell);
            tableBody.appendChild(row);
        });
    }

    // Initial data load
    fetchAndRenderECGData();
});
