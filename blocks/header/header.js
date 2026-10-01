// desktop layout (inline nav + search) starts at this width, as on the WKND source
const isDesktop = window.matchMedia('(min-width: 1200px)');

/**
 * Fetches the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), url: resp.url };
}

/**
 * Resolves relative image paths against the fragment URL, not the page URL.
 * @param {Element} root
 * @param {string} baseUrl
 */
function resolveImages(root, baseUrl) {
  root.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), baseUrl).href;
  });
}

/**
 * Normalises a path for current-page comparison (drops /content, .html, trailing slash).
 * @param {string} pathname
 */
function normalisePath(pathname) {
  return pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
}

/**
 * Marks the link to the current page with aria-current.
 * @param {Element} root
 */
function markCurrentPage(root) {
  const here = normalisePath(window.location.pathname);
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.origin === window.location.origin && normalisePath(url.pathname) === here) {
      a.setAttribute('aria-current', 'page');
    }
  });
}

/**
 * Builds the search box from the authored label. The site has no search backend yet,
 * so submitting is a no-op.
 * @param {string} label
 */
function buildSearch(label) {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = label;
  input.setAttribute('aria-label', label);
  input.autocomplete = 'off';
  form.append(input);
  form.addEventListener('submit', (e) => e.preventDefault());
  return form;
}

/**
 * Builds the locale selector from an authored list of countries
 * (li > p[img + name] + ul > li > a); the current language is wrapped in <strong>.
 * @param {HTMLUListElement} list
 */
function buildLocale(list) {
  const current = list.querySelector('strong a') || list.querySelector('ul a');
  if (!current) return null;
  const currentFlag = current.closest('ul').closest('li')?.querySelector('img');

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-locale-toggle';
  toggle.textContent = current.textContent.trim();
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'nav-locale-panel');
  toggle.setAttribute('aria-label', `Toggle language ${current.textContent.trim()}`);
  if (currentFlag) toggle.style.backgroundImage = `url("${currentFlag.src}")`;

  const panel = document.createElement('ul');
  panel.id = 'nav-locale-panel';
  panel.className = 'nav-locale-panel';
  [...list.children].forEach((country) => {
    const li = document.createElement('li');
    li.className = 'nav-locale-item';
    const title = country.querySelector(':scope > p');
    const flag = title?.querySelector('img');
    if (flag) li.style.backgroundImage = `url("${flag.src}")`;
    const name = document.createElement('span');
    name.className = 'nav-locale-country';
    name.textContent = title ? title.textContent.trim() : '';
    const langs = document.createElement('ul');
    langs.className = 'nav-locale-langs';
    country.querySelectorAll(':scope > ul a').forEach((a) => {
      const langLi = document.createElement('li');
      const link = a.cloneNode(true);
      link.className = 'nav-locale-link';
      if (a === current) link.setAttribute('aria-current', 'true');
      langLi.append(link);
      langs.append(langLi);
    });
    li.append(name, langs);
    panel.append(li);
  });

  // the panel's visibility follows the toggle's aria-expanded state
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const setOpen = (open) => toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.addEventListener('click', () => setOpen(!isOpen()));
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  wrapper.append(toggle, panel);
  return wrapper;
}

/**
 * Marks primary links that point to the brand (home) URL as mobile-only:
 * the source shows "Home" in its mobile drawer but not in the desktop nav.
 * @param {Element} sections
 * @param {Element} brand
 */
function markMobileOnly(sections, brand) {
  const home = brand.querySelector('a[href]');
  if (!home) return;
  const homePath = normalisePath(new URL(home.href, window.location.href).pathname);
  sections.querySelectorAll('li > a[href]').forEach((a) => {
    if (normalisePath(new URL(a.href, window.location.href).pathname) === homePath) {
      a.closest('li').classList.add('nav-mobile-only');
    }
  });
}

/**
 * Opens or closes the mobile drawer; the page is pushed aside while it is open.
 * @param {Element} nav
 * @param {boolean} [force]
 */
function toggleMenu(nav, force) {
  const open = (force ?? nav.getAttribute('aria-expanded') !== 'true') && !isDesktop.matches;
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const button = nav.querySelector('.nav-hamburger button');
  if (button) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  document.body.classList.toggle('nav-drawer-open', open);
  // the pushed page must not become horizontally scrollable
  document.documentElement.style.overflowX = open ? 'hidden' : '';
  document.body.style.overflowX = open ? 'hidden' : '';
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const source = document.createElement('div');
  source.innerHTML = fragment.html;
  resolveImages(source, fragment.url);
  const [brandSection, sectionsSection, toolsSection] = source.querySelectorAll(':scope > div');

  // row 1: brand, primary links, search
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) brand.append(...brandSection.childNodes);

  const sections = document.createElement('div');
  sections.className = 'nav-sections';
  const primary = sectionsSection?.querySelector('ul');
  if (primary) sections.append(primary);

  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const searchLabel = [...(toolsSection?.querySelectorAll(':scope > p') || [])]
    .find((p) => !p.querySelector('img'))?.textContent.trim();
  if (searchLabel) tools.append(buildSearch(searchLabel));

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));

  // centred content column inside the full-width white bar
  const navInner = document.createElement('div');
  navInner.className = 'nav-inner';
  navInner.append(hamburger, brand, sections, tools);
  nav.append(navInner);
  markCurrentPage(sections);
  markMobileOnly(sections, brand);

  // row 0: utility bar with the locale selector
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  const utilityInner = document.createElement('div');
  utilityInner.className = 'nav-utility-inner';
  const localeList = toolsSection?.querySelector(':scope > ul');
  const locale = localeList ? buildLocale(localeList) : null;
  if (locale) utilityInner.append(locale);
  utility.append(utilityInner);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(utility, nav);
  block.append(navWrapper);

  // the main bar shrinks and gains a shadow once the page scrolls
  const onScroll = () => navWrapper.classList.toggle('is-scrolled', window.scrollY > 0);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // close the mobile menu when crossing to desktop, and vice versa
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));
  // tapping the pushed page (outside the drawer and the hamburger) closes the drawer
  document.addEventListener('click', (e) => {
    if (nav.getAttribute('aria-expanded') === 'true'
      && !sections.contains(e.target) && !hamburger.contains(e.target)) {
      toggleMenu(nav, false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburger.querySelector('button').focus();
    }
  });
}
