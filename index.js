import { fetchJSON, renderProjects, fetchGitHubData } from "./global.js";

const projects = await fetchJSON("./lib/projects.json");
const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector(".projects");

const githubData = await fetchGitHubData("katefengx");

const profileStats = document.querySelector("#profile-stats");
if (profileStats) {
  profileStats.innerHTML = `
        <h3 class="profile-stats-heading">My GitHub Stats</h3>
        <dl class='profile-stats-grid'>
            <div><dt>PUBLIC REPOS</dt><dd>${githubData.public_repos}</dd></div>
            <div><dt>FOLLOWERS</dt><dd>${githubData.followers}</dd></div>
            <div><dt>FOLLOWING</dt><dd>${githubData.following}</dd></div>
        </dl>
        `;
}

renderProjects(latestProjects, projectsContainer, "h2");
