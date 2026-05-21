import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import './DashboardStyles.css';

const StatsChart = ({ type, data }) => {
    // useRef is used to directly access the SVG DOM element.
    const svgRef = useRef();

    // useEffect hook runs the D3 drawing logic whenever 'data' or 'type' props change.
    useEffect(() => {
        console.log(`StatsChart (Type: ${type}): useEffect triggered.`);
        console.log(`StatsChart (Type: ${type}): Received data:`, data);

        if (!data || data.length === 0) {
            console.log(`StatsChart (Type: ${type}): No data or empty data received. Clearing SVG.`);
            // If no data, clear any existing content within the SVG.
            d3.select(svgRef.current).selectAll('*').remove();
            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Define SVG dimensions and margins.
        const width = 200;
        const height = 200;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const availableHeightForChart = height - margin.top - margin.bottom; 
        const pieChartRatio = 1; 
        const actualPieHeight = availableHeightForChart * pieChartRatio;  
        const radius = Math.min(width / 2 - margin.left, actualPieHeight / 2);

        console.log(`StatsChart (Type: ${type}): SVG dimensions - Width: ${width}, Height: ${height}`);
        console.log(`StatsChart (Type: ${type}): Calculated Pie Radius: ${radius}`);


        // Append group (g) element for pie chart.
        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${margin.top + actualPieHeight / 2})`);

        // Append another group (g) element for the chart legend.
        const legendG = svg.append('g')
            .attr('class', 'chart-legend')
            .attr('transform', `translate(${margin.left}, ${margin.top + actualPieHeight + 15})`);


        const tooltip = d3.select('body').append('div')
            .attr('class', 'd3-tooltip')
            .style('opacity', 0);


            // If the chart type is 'userActivity' (Line Chart)
        if (type === 'userActivity') {
            console.log(`StatsChart (Type: ${type}): Drawing User Activity chart.`);
            const parseDate = d3.timeParse('%Y-%m-%d');
            const activityData = data.map(d => ({
                date: parseDate(d.date),
                count: d.count
            })).sort((a, b) => a.date - b.date);

            if (activityData.some(d => d.date === null)) {
                console.error(`StatsChart (Type: ${type}): Date parsing failed for some data points! Check date format.`);
                g.append('text')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .text('Error: Invalid date format');
                return;
            }

            g.attr('transform', `translate(${margin.left},${margin.top})`);

            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            // Define the time scale for the X-axis - The range of dates in the data.
            const xScale = d3.scaleTime()
                .domain(d3.extent(activityData, d => d.date))
                .range([0, innerWidth]);

            // Define the linear scale for the Y-axis - From 0 to the maximum count value
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(activityData, d => d.count) * 1.1])
                .range([innerHeight, 0]);

            // Create a line generator.
            const line = d3.line()
                .x(d => xScale(d.date)) // X position for each data point
                .y(d => yScale(d.count)); // Y position for each data point

            // Append the X-axis (bottom axis) to the chart.
            g.append('g')
                .attr('transform', `translate(0,${innerHeight})`)
                // Call d3.axisBottom to create the axis - displays ticks every 7 days.
                .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(7)).tickFormat(d3.timeFormat('%b %d')))
                .selectAll('text')
                .style('text-anchor', 'end') // Align text to the right
                .attr('dx', '-.8em') // horizontal offset
                .attr('dy', '.15em') // vertical offset
                .attr('transform', 'rotate(-65)'); // Rotate text to prevent overlapping

            // Append the Y-axis (left axis) to the chart.
            g.append('g')
                .call(d3.axisLeft(yScale));

            g.append('path')
                .datum(activityData)
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 2)
                .attr('d', line); // Use the line generator to draw the path.

        } else if (type === 'contentDistribution') { // If the chart type is 'contentDistribution' (Pie Chart)
            console.log(`StatsChart (Type: ${type}): Drawing Content Distribution chart.`);
            const distributionData = data;

            if (!distributionData || distributionData.length === 0) {
                console.warn("Content Distribution: No data for legend.");
                return;
            }

            // Define a color scale - Unique content types
            const color = d3.scaleOrdinal()
                .domain(distributionData.map(d => d.type))
                .range(d3.schemeCategory10);

            // Create a pie generator- determines the size of each slice.
            const pie = d3.pie().value(d => d.count).sort(null);
            // innerRadius(0): Creates a solid pie chart.
            const arc = d3.arc().innerRadius(0).outerRadius(radius);

            // Select all pie slices
            const arcs = g.selectAll('.arc')
                .data(pie(distributionData))
                .enter().append('g') // For each slice, append a 'g' element
                .attr('class', 'arc') // Add a class for styling
                .on('mouseover', function (event, d) {
                    tooltip.transition() // Start a transition for the tooltip
                        .duration(200)
                        .style('opacity', .9);
                    tooltip.html(`
                        <strong>${d.data.type}</strong><br/>
                        Count: ${d.data.count}<br/>
                        Percentage: ${(d.data.count / d3.sum(distributionData, d => d.count) * 100).toFixed(1)}%
                    `)
                        .style('left', (event.pageX) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                    d3.select(this)
                        .select('path')
                        .attr('stroke', 'white')
                        .attr('stroke-width', 2);
                })
                .on('mouseout', function (event, d) {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                    d3.select(this)
                        .select('path')
                        .attr('stroke', 'none');
                });

            arcs.append('path')
                .attr('d', arc) // Use the arc generator to draw the slice shape
                .attr('fill', d => color(d.data.type)) // Fill the slice based on content type (using the color scale)
                .attr('stroke', 'white')
                .style('stroke-width', '2px');

            const legendItemHeight = 25; // Height of each legend item
            const legendTextOffset = 20; 
            
            const legend = legendG.selectAll('.legend-item')
                .data(distributionData) 
                .enter().append('g')
                .attr('class', 'legend-item')
                .attr('transform', (d, i) => `translate(0, ${i * legendItemHeight})`); // כל פריט מתחת לקודמו

            // Append a colored rectangle to each legend item.
            legend.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', d => color(d.type));

             // Append text to each legend item (content type name and count).
            legend.append('text')
                .attr('x', legendTextOffset) 
                .attr('y', 7.5) 
                .attr('dy', '0.35em')
                .text(d => `${d.type} (${d.count})`) 
                .style('font', '14px sans-serif')
                .attr('fill', '#333');


            // Check if the legend overflows the SVG boundaries.
            const totalLegendHeight = distributionData.length * legendItemHeight;
            const legendBottomPosition = margin.top + actualPieHeight + 15 + totalLegendHeight;

            console.log(`StatsChart (Type: ${type}): Total SVG Height: ${height}`);
            console.log(`StatsChart (Type: ${type}): Legend Bottom Position: ${legendBottomPosition}`);

            if (legendBottomPosition > height) {
                console.warn(`StatsChart (Type: ${type}): Legend is likely cut off. Increase SVG height.`);
            }


        } else {
            console.warn(`StatsChart (Type: ${type}): Unknown chart type.`);
            g.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('text-anchor', 'middle')
                .text('Unknown chart type');
        }
    }, [data, type]); // Dependencies: re-run if 'data' or 'type' props change.

    if (!data || data.length === 0) {
        return <div className="no-chart-data">No data available for this chart.</div>;
    }

    // The React component's render method
    return (
        <div className="stats-chart-container">
            <svg ref={svgRef} className="chart-svg"></svg>
        </div>
    );
};

export default StatsChart;