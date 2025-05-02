console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'cv/', title: 'CV' },
    { url: 'https://github.com/katefengx', title: 'GitHub'}
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    
    const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"                  // Local server
    : "/portfolio/";         // GitHub Pages repo name

    url = !url.startsWith('http') ? BASE_PATH + url : url;
    nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}

let navLinks = $$("nav a");

for (let a of navLinks) {
    if (a.host !== location.host) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    }
}

let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname,
);

currentLink?.classList.add('current');

// drop down menu for light/dark

function setColorScheme(colorScheme){
    return document.documentElement.style.setProperty('color-scheme', colorScheme);
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
            <option value="light dark">automatic</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
      </label>`,
);

let select = document.querySelector("label.color-scheme select");

if ("colorScheme" in localStorage) {
    select.value = localStorage.colorScheme;
    setColorScheme(localStorage.colorScheme);
} else {
    if (matchMedia("(prefers-color-scheme: dark)").matches) {
        select.value = "dark";
        setColorScheme("dark");
    } else {
        select.value = "light";
        setColorScheme("light");
    }
}

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    setColorScheme(event.target.value);
    localStorage.colorScheme = event.target.value;
});

let form = document.querySelector("form");

form?.addEventListener('submit', function (event){
    event.preventDefault();

    let data = new FormData(form);
    let params = [];

    for (let [name, value] of data) {
        params.push(`${name}=${encodeURIComponent(value)}`);
    }
    
    let url = form.action + "?" + params.join("&");
    location.href = url;
})

// Projects Page

export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        console.log(response);

        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched Projects Data:", data);
        return data;

    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';
    const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    if (!validHeadings.includes(headingLevel)) {
        console.warn(`Invalid headingLevel "${headingLevel}" passed. Defaulting to "h2".`);
        headingLevel = 'h2';
    }

    for (const project of projects) {
        const article = document.createElement('article');
    
        const link = document.createElement('a');
        link.href = project.link || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.textDecoration = 'none';
    
        const heading = document.createElement(headingLevel);
        heading.textContent = project.title;
    
        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;
        img.onerror = () => {
            console.warn(`Image not found for project: ${project.title}`);
            img.src = 'https://i.pinimg.com/736x/d7/67/ef/d767effce525cda3e2bb6c8d35625f61.jpg'; // fallback image
        };
    
        const textWrapper = document.createElement('div');
        textWrapper.classList.add('project-text');

        const description = document.createElement('p');
        description.textContent = project.description;

        const year = document.createElement('p');
        year.textContent = `Year: ${project.year}`;
        year.classList.add('project-year');

        textWrapper.appendChild(description);
        textWrapper.appendChild(year);

        // Add everything to link and article
        link.appendChild(heading);
        link.appendChild(img);
        link.appendChild(textWrapper);

        article.appendChild(link);
        containerElement.appendChild(article);
    }
    
}

export async function fetchGitHubData(username) {
    try {
        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) {
            throw new Error(`GitHub API error: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to fetch GitHub data:", err);
        return null;
    }
}