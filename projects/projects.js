import { fetchJSON, renderProjects } from '../global.js';

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "../"                  // Local server
    : "/portfolio/";         // GitHub Pages repo name

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle && projects) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

renderProjects(projects, projectsContainer, 'h2');