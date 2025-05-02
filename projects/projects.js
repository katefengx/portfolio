import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "../"                  // Local server
    : "https://katefengx.github.io/portfolio/";         // GitHub Pages repo name

import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle && projects) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

renderProjects(projects, projectsContainer, 'h2');


// ===== D3 PIE CHART SETUP =====

const searchInput = document.querySelector('.searchBar');

let searchQuery = '';

searchInput.addEventListener('change', (event) => {
    searchQuery = event.target.value.toLowerCase();  // Update the search query
    const filteredProjects = projects.filter((project) =>
        Object.values(project).join(' ').toLowerCase().includes(searchQuery)
    );

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects, searchQuery);  // Pass the search query to the pie chart
});

function renderPieChart(projectsGiven) {
    let svg = d3.select('svg');
    svg.selectAll('path').remove();
    d3.select('.legend').selectAll('li').remove();

    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let rolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );

    let data = rolledData.map(([year, count]) => {
        return { 
            value: count, 
            label: year 
        };
    });

    let sliceGenerator = d3.pie().value(d => d.value);
    let arcData = sliceGenerator(data);

    let arc = d3.arc().innerRadius(0).outerRadius(100);
    svg.attr('viewBox', '0 0 200 200');

    let g = svg.append('g')
        .attr('transform', 'translate(100, 100)');
    
    let selectedIndex = -1;

    let legend = d3.select('.legend');
    data.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', `legend-${idx}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
        });

    arcData.forEach((arcDatum, idx) => {
        g.append('path')
            .attr('d', arc(arcDatum))
            .attr('fill', colors(idx)) 
            .on('click', () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;

                console.log(`You clicked on the slice for ${data[idx].label} (${data[idx].value} projects)`);

                d3.selectAll('path')
                    .attr('class', '')
                    .classed('selected', false)
                    .attr('fill', (_, i) => colors(i));
            
                d3.selectAll('.legend li')
                    .classed('selected', false);

                d3.select(event.target) 
                    .classed('selected', true) 
                    .attr('opacity', 1);
                
                d3.select(`.legend-${idx}`)
                .classed('selected', !d3.select(`.legend-${idx}`).classed('selected'));
                
                const selectedYear = data[selectedIndex].label;
                const filteredProjects = projects.filter(project =>
                    project.year === selectedYear &&
                    Object.values(project).join(' ').toLowerCase().includes(searchQuery)
                );
                renderProjects(filteredProjects, projectsContainer, 'h2');
            });

    });
}

renderPieChart(projects);

