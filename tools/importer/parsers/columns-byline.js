/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-byline. Base: columns.
 * Source: https://wknd.site/us/en/magazine/arctic-surfing.html (.cmp-byline)
 * Generated: 2026-09-22
 *
 * Structure (from library-description.txt): Columns block — first row is the block
 * name, subsequent row(s) contain one cell per column. Here: a single content row
 * with two columns.
 *   - Column 1: author avatar image + name + occupation(s)
 *   - Column 2: social share links (optional in source; empty cell kept so the row
 *     preserves a consistent 2-column shape)
 */
export default function parse(element, { document }) {
  // Column 1 content — validated against .cmp-byline source HTML.
  const image = element.querySelector('.cmp-byline__image img, .cmp-image__image, img');
  const name = element.querySelector('.cmp-byline__name, h2, [class*="name"]');
  const occupation = element.querySelector('.cmp-byline__occupations, [class*="occupation"], p');

  // Column 2 content — social/share links. Not present in this instance; fallbacks
  // cover likely variations so cross-page instances still extract correctly.
  const socialLinks = Array.from(element.querySelectorAll(
    '.cmp-byline__social a, [class*="social"] a, [class*="share"] a',
  ));

  // Empty-block guard: bail gracefully if there is no meaningful author content.
  if (!image && !name && !occupation) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cell1 = [];
  if (image) cell1.push(image);
  if (name) cell1.push(name);
  if (occupation) cell1.push(occupation);

  const cell2 = [];
  cell2.push(...socialLinks);

  const cells = [];
  // Two-column content row. Pad column 2 with '' when no social links exist so the
  // row keeps a consistent column count.
  cells.push([cell1, cell2.length ? cell2 : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-byline', cells });
  element.replaceWith(block);
}
