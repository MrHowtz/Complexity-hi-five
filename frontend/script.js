document.addEventListener('DOMContentLoaded', function () {
    const apiEndpoint = 'http://localhost:3000/api/observations';

    // Fetch ECG data and render the chart
    fetch(apiEndpoint)
        .then((response) => response.json())
        .then((data) => {
            console.log('Fetched data:', data);

            // Extract the values and seconds from the data
            const uniqueData = [];
            const seenSeconds = new Set();

            // Filter the data to include only the first occurrence of each second
            data.forEach((d) => {
                const seconds = d.seconds; // From the server-side data
                if (!seenSeconds.has(seconds)) {
                    seenSeconds.add(seconds);
                    uniqueData.push(d); // Add unique second data
                }
            });

            // Now, we have data with unique seconds only
            const values = uniqueData.map((d) => d.value);
            const seconds = uniqueData.map((d) => d.seconds); // Use the seconds for the x-axis

            // Render the D3 chart with the unique seconds
            renderChart(seconds, values);

            // Populate the table with data
            populateTable(uniqueData);
        })
        .catch((error) => console.error('Error loading ECG data:', error));

    function renderChart(seconds, values) {
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear existing SVG (if any)
        d3.select('#chart').selectAll('*').remove();

        // Create SVG container
        const svg = d3
            .select('#chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Define scales
        const xScale = d3
            .scaleLinear()
            .domain([d3.min(seconds), d3.max(seconds)]) // x-axis spans from min to max second
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain([d3.min(values), d3.max(values)]) // y-axis spans from min to max value
            .range([height, 0]);

        // Define axes
        const xAxis = d3.axisBottom(xScale).ticks(seconds.length);
        const yAxis = d3.axisLeft(yScale).ticks(5);

        // Append x-axis
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

        // Append y-axis
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

        // Draw line
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

        // Add data points
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

        // Add hover tooltip for data points
        const tooltip = d3
            .select('body')
            .append('div')
            .style('position', 'absolute')
            .style('background', '#fff')
            .style('border', '1px solid #ccc')
            .style('padding', '5px')
            .style('border-radius', '4px')
            .style('box-shadow', '0px 2px 4px rgba(0, 0, 0, 0.1)')
            .style('display', 'none');

        svg
            .selectAll('circle')
            .on('mouseover', function (event, d) {
                tooltip
                    .html(`Value: ${d}`)
                    .style('display', 'block')
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 20}px`);
            })
            .on('mouseout', () => {
                tooltip.style('display', 'none');
            });
    }

    // Function to populate the table with index and ECG values
    function populateTable(data) {
        const tableBody = document.querySelector('#ecgTable tbody');
        tableBody.innerHTML = ''; // Clear any existing rows

        data.forEach((d, index) => {
            const row = document.createElement('tr');
            const indexCell = document.createElement('td');
            const valueCell = document.createElement('td');

            // Add the index and ECG value to the cells
            indexCell.textContent = index; // Index of the data point
            valueCell.textContent = d.value; // ECG value for this data point

            // Append the cells to the row
            row.appendChild(indexCell);
            row.appendChild(valueCell);

            // Append the row to the table body
            tableBody.appendChild(row);
        });
    }
});
