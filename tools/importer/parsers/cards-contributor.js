/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-contributor. Base: cards.
 * Source: https://wknd.site/us/en/about-us.html
 * Selector: .cmp-experience-fragment--contributor (one element per contributor card).
 * The parser is invoked once per matched element (per card) and produces ONE cards row
 * with two cells: [avatar image] | [name heading + occupation + social icon links].
 * Generated: 2026-09-23
 */
export default function parse(element, { document }) {
  // Cell 1: avatar image (validated: img.cmp-image__image inside .image .cmp-image)
  const image = element.querySelector('.cmp-image img, img.cmp-image__image, img');

  // Cell 2 content: name heading, occupation, and the row of social icon links.
  // Source has two .cmp-title blocks: h3 = contributor name, h5 = occupation.
  const titles = Array.from(element.querySelectorAll('.cmp-title__text, .cmp-title h3, .cmp-title h5'));
  const name = titles[0] || null;                 // first title = contributor name (h3)
  const occupation = titles.length > 1 ? titles[1] : null; // second title = occupation (h5)

  // Social icon links: Facebook, Twitter, Instagram anchors inside the button building block.
  const socialLinks = Array.from(
    element.querySelectorAll('.cmp-buildingblock--btn-list a.cmp-button, .cmp-button, a[class*="button"]'),
  );

  const contentCell = [];
  if (name) contentCell.push(name);
  if (occupation) contentCell.push(occupation);
  contentCell.push(...socialLinks);

  // Empty-block guard: bail gracefully if essential content is missing.
  if (!image && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Cards block: 2 columns per card row → [image cell, content cell]
  cells.push([image || '', contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-contributor', cells });
  element.replaceWith(block);
}
