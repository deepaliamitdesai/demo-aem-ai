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

  WebImporter.DOMUtils.remove(element, ['script', 'link', 'style', 'noscript']);

  // The demo template renders without the site nav, so keep the "Back to site" link
  // as its own small section above the heading band.
  const back = element.querySelector(':scope > .back-to-site');
  if (back) {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = '/';
    link.textContent = back.textContent.trim();
    p.append(link);
    const sectionMetadata = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style: 'demo-back' },
    });
    back.replaceWith(p, sectionMetadata, document.createElement('hr'));
  }

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
