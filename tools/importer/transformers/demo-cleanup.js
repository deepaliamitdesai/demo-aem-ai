/* eslint-disable */
/* global WebImporter */

// Stable home of the demo page's assets (the branch preview may go away).
const ASSET_BASE = 'https://main--demo-aem-ai--deepaliamitdesai.aem.page/demo1/';

/**
 * Cleanup for the standalone demo page (/demo1/main.html) imported as a DA page.
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const { document } = payload;

  // The DA page gets the site nav, so the standalone "Back to site" link is redundant.
  WebImporter.DOMUtils.remove(element, ['.back-to-site', 'script', 'link', 'style', 'noscript']);

  // The button has no action on the source page; keep its label as bold text.
  element.querySelectorAll('button').forEach((button) => {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = button.textContent.trim();
    p.append(strong);
    button.replaceWith(p);
  });

  // The demo's own <header>/<main>/<footer> hold page text (heading, tagline, copyright): keep
  // each as its own section, styled by the demo template (green band, white card, dark bar).
  [['header', 'demo-hero'], ['main', 'demo-card'], ['footer', 'demo-footer']].forEach(([selector, style]) => {
    const part = element.querySelector(`:scope > ${selector}`);
    if (!part) return;
    const sectionMetadata = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style },
    });
    part.replaceWith(...part.childNodes, sectionMetadata, document.createElement('hr'));
  });
  // the importer adds its own break before the page metadata
  const last = element.lastElementChild;
  if (last && last.tagName === 'HR') last.remove();

  // Point images at the main site so the page doesn't depend on a branch preview.
  element.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', new URL(img.getAttribute('src'), ASSET_BASE).href);
  });
}
