const GITHUB_USER = "INCONNU-BOY-SENSEI";

const REPO_EXCLUDE = /whats\s?app|baileys|wa[-_ ]?bot|\bbot\b|[-_]bot\b|\bbot[-_]|[-_]md\b|\bxmd\b|session[-_ ]?id|pair(ing)?[-_ ]?code/i;

const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  try { localStorage.setItem("theme", theme); } catch (e) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0C0C0B" : "#EEECE7");
}
applyTheme(root.getAttribute("data-theme") || "dark");

document.getElementById("themeToggle").addEventListener("click", () => {
  root.classList.add("theme-anim");
  applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  setTimeout(() => root.classList.remove("theme-anim"), 500);
});

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
function setMenu(open) {
  navLinks.classList.toggle("is-open", open);
  root.classList.toggle("menu-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
}
navToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("is-open")));
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

const navIndicator = document.getElementById("navIndicator");
const navAnchors = Array.from(navLinks.querySelectorAll("a"));
function moveIndicator(a) {
  if (!a || window.innerWidth <= 860) {
    navIndicator.style.opacity = "0";
    return;
  }
  navIndicator.style.opacity = "1";
  navIndicator.style.width = `${a.offsetWidth}px`;
  navIndicator.style.transform = `translateX(${a.offsetLeft}px)`;
}
if ("IntersectionObserver" in window) {
  const sectionIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id === "open" ? "contact" : e.target.id;
        const a = navAnchors.find((x) => x.getAttribute("href") === `#${id}`);
        navAnchors.forEach((x) => x.classList.toggle("is-active", x === a));
        moveIndicator(a);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("main section[id]").forEach((s) => sectionIO.observe(s));
}

const langToggle = document.getElementById("langToggle");
const langWrap = document.querySelector(".lang-wrap");
langToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!hasThirdPartyConsent()) {
    openCookieModal();
    return;
  }
  langWrap.classList.toggle("is-open");
});
document.addEventListener("click", (e) => {
  if (!langWrap.contains(e.target)) langWrap.classList.remove("is-open");
});

function googleTranslateElementInit() {
  new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "google_translate_element");
}
function visitorLang() {
  const full = navigator.language || "en";
  const short = full.toLowerCase().split("-")[0];
  if (short === "zh") return /tw|hk|hant/i.test(full) ? "zh-TW" : "zh-CN";
  if (short === "he") return "iw";
  return short;
}

function writeTranslateCookie(value, maxAge) {
  const base = `googtrans=${value};path=/;max-age=${maxAge}`;
  document.cookie = base;
  if (location.hostname.includes(".")) document.cookie = `${base};domain=.${location.hostname}`;
}

function autoTranslate() {
  if (/(?:^|;\s*)googtrans=/.test(document.cookie)) return;
  const lang = visitorLang();
  if (lang !== "en") writeTranslateCookie(`/en/${lang}`, 60 * 60 * 24 * 365);
}

function clearTranslate() {
  writeTranslateCookie("", 0);
}

let translateScriptLoaded = false;
function loadGoogleTranslate() {
  if (translateScriptLoaded) return;
  translateScriptLoaded = true;
  autoTranslate();
  const s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.body.appendChild(s);
}

const skills = [
  { name: "JavaScript", icon: "devicon-javascript-plain" },
  { name: "TypeScript", icon: "devicon-typescript-plain" },
  { name: "Node.js", icon: "devicon-nodejs-plain" },
  { name: "React", icon: "devicon-react-original" },
  { name: "Express", icon: "devicon-express-original" },
  { name: "PostgreSQL", icon: "devicon-postgresql-plain" },
  { name: "MongoDB", icon: "devicon-mongodb-plain" },
  { name: "Docker", icon: "devicon-docker-plain" },
  { name: "Android", icon: "devicon-android-plain" },
  { name: "Capacitor", icon: "devicon-capacitor-plain" },
  { name: "Git", icon: "devicon-git-plain" },
  { name: "GitHub", icon: "devicon-github-original" },
];
const half = Math.ceil(skills.length / 2);
const skillHTML = (list) =>
  list.map((s) => `<span class="mq-item"><i class="${s.icon}" aria-hidden="true"></i>${s.name}</span><span class="mq-sep" aria-hidden="true">/</span>`).join("");
InconnuBoy.initMarquee(document.querySelector('[data-marquee="1"]'), skillHTML(skills.slice(0, half)));
InconnuBoy.initMarquee(document.querySelector('[data-marquee="-1"]'), skillHTML(skills.slice(half)));

const liveClock = document.getElementById("liveClock");
function updateClock() {
  try {
    liveClock.textContent = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
    }) + " GMT-3";
  } catch (e) {
    liveClock.textContent = "GMT-3";
  }
}
updateClock();
setInterval(updateClock, 15000);

document.getElementById("year").textContent = new Date().getFullYear();

InconnuBoy.init();

const LANG_ICON = {
  JavaScript: "devicon-javascript-plain", TypeScript: "devicon-typescript-plain",
  HTML: "devicon-html5-plain", CSS: "devicon-css3-plain", Python: "devicon-python-plain",
  Java: "devicon-java-plain", Kotlin: "devicon-kotlin-plain", Dart: "devicon-dart-plain",
  "C++": "devicon-cplusplus-plain", C: "devicon-c-plain", "C#": "devicon-csharp-plain",
  PHP: "devicon-php-plain", Go: "devicon-go-plain", Rust: "devicon-rust-plain",
  Shell: "devicon-bash-plain", Swift: "devicon-swift-plain", Vue: "devicon-vuejs-plain",
  Dockerfile: "devicon-docker-plain",
};

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const REPO_PINNED = ["skyhost"];

function isExcluded(r) {
  if (REPO_PINNED.includes(r.name.toLowerCase())) return false;
  const hay = [r.name, r.description || "", ...(r.topics || [])].join(" ");
  return REPO_EXCLUDE.test(hay);
}

async function loadGitHub() {
  const list = document.getElementById("repoList");
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`),
    ]);
    if (!userRes.ok || !reposRes.ok) throw new Error("GitHub API error");
    const user = await userRes.json();
    const repos = (await reposRes.json()).filter((r) => !isExcluded(r));

    const own = repos.filter((r) => !r.fork);
    const stars = own.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const langs = {};
    own.forEach((r) => r.language && (langs[r.language] = (langs[r.language] || 0) + 1));
    const topLang = Object.entries(langs).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    InconnuBoy.countWhenVisible(document.getElementById("statRepos"), repos.length);
    InconnuBoy.countWhenVisible(document.getElementById("statStars"), stars);
    InconnuBoy.countWhenVisible(document.getElementById("statFollowers"), user.followers ?? 0);
    document.getElementById("statLang").textContent = topLang;

    const top = own
      .filter((r) => REPO_PINNED.includes(r.name.toLowerCase()))
      .sort((a, b) => (REPO_PINNED.includes(b.name.toLowerCase()) - REPO_PINNED.includes(a.name.toLowerCase())) || b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 6);

    if (!top.length) {
      list.innerHTML = `<li class="repo-list__empty mono">No public repositories yet.</li>`;
      return;
    }

    list.innerHTML = top
      .map((r, i) => {
        const icon = LANG_ICON[r.language];
        return `
        <li>
          <a class="repo" href="${r.html_url}" target="_blank" rel="noopener" data-cursor="GitHub">
            <span class="repo__i mono">${String(i + 1).padStart(2, "0")}</span>
            <span class="repo__main">
              <span class="repo__name notranslate" translate="no">${escapeHtml(r.name)}</span>
              <span class="repo__desc">${r.description ? escapeHtml(r.description) : "No description provided."}</span>
            </span>
            <span class="repo__meta mono">
              ${r.language ? `<span class="repo__lang">${icon ? `<i class="${icon}" aria-hidden="true"></i>` : ""}${escapeHtml(r.language)}</span>` : ""}
              <span>★ ${r.stargazers_count}</span>
            </span>
            <span class="repo__arrow" aria-hidden="true">↗</span>
          </a>
        </li>`;
      })
      .join("");
    list.setAttribute("data-anim", "stagger");
    InconnuBoy.observe(list.parentElement);
  } catch (err) {
    list.innerHTML = `<li class="repo-list__empty mono">Couldn't reach GitHub right now — browse github.com/INCONNU-BOY-SENSEI directly.</li>`;
  }
}
loadGitHub();

const COOKIE_KEY = "cookie_consent_v1";

function readConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeConsent({ preferences, thirdparty }) {
  const consent = {
    necessary: true,
    preferences: !!preferences,
    thirdparty: !!thirdparty,
    ts: Date.now(),
  };
  try {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
  } catch {}
  return consent;
}

function hasThirdPartyConsent() {
  const c = readConsent();
  return !!(c && c.thirdparty);
}

const cookieBanner = document.getElementById("cookieBanner");
const cookieModal = document.getElementById("cookieModal");
const mapConsent = document.getElementById("mapConsent");
const mapIframe = document.getElementById("mapIframe");

function applyConsent(consent) {
  if (consent.thirdparty) {
    loadGoogleTranslate();
    if (mapIframe && !mapIframe.src) mapIframe.src = mapIframe.dataset.src;
    if (mapConsent) mapConsent.hidden = true;
  } else {
    clearTranslate();
    if (mapIframe) mapIframe.removeAttribute("src");
    if (mapConsent) mapConsent.hidden = false;
  }
}

function hideBanner() {
  cookieBanner.hidden = true;
}
function showBanner() {
  cookieBanner.hidden = false;
}
function openCookieModal() {
  const c = readConsent();
  document.getElementById("cookieCatPrefs").checked = c ? c.preferences : true;
  document.getElementById("cookieCatThird").checked = c ? c.thirdparty : true;
  cookieModal.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeCookieModal() {
  cookieModal.hidden = true;
  document.body.style.overflow = "";
}

document.getElementById("cookieAcceptAll").addEventListener("click", () => {
  const c = writeConsent({ preferences: true, thirdparty: true });
  applyConsent(c);
  hideBanner();
});
document.getElementById("cookieReject").addEventListener("click", () => {
  const c = writeConsent({ preferences: false, thirdparty: false });
  applyConsent(c);
  hideBanner();
});
document.getElementById("cookieCustomize").addEventListener("click", openCookieModal);
document.getElementById("footerCookieLink").addEventListener("click", openCookieModal);
document.getElementById("cookieModalClose").addEventListener("click", closeCookieModal);
document.getElementById("cookieModalBackdrop").addEventListener("click", closeCookieModal);
document.getElementById("cookieModalReject").addEventListener("click", () => {
  const c = writeConsent({ preferences: false, thirdparty: false });
  applyConsent(c);
  hideBanner();
  closeCookieModal();
});
document.getElementById("cookieModalSave").addEventListener("click", () => {
  const preferences = document.getElementById("cookieCatPrefs").checked;
  const thirdparty = document.getElementById("cookieCatThird").checked;
  const c = writeConsent({ preferences, thirdparty });
  applyConsent(c);
  hideBanner();
  closeCookieModal();
});
if (mapConsent) {
  document.getElementById("mapConsentAccept").addEventListener("click", () => {
    const existing = readConsent();
    const c = writeConsent({ preferences: existing ? existing.preferences : true, thirdparty: true });
    applyConsent(c);
    hideBanner();
  });
}

(function initConsent() {
  const existing = readConsent();
  if (existing) {
    applyConsent(existing);
  } else {
    showBanner();
  }
})();
