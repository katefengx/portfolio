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