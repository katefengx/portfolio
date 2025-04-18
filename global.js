console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'cv/', title: 'CV' },
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
            <option value="auto">automatic</option>
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