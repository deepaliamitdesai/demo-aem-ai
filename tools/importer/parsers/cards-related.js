/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-related. Base: cards (no images variant).
 * Source: https://wknd.site/us/en/magazine/arctic-surfing.html (.cmp-list--upnext)
 * Generated: 2026-09-22
 *
 * Structure (from library-description.txt — "Cards (no images)"): 1 column, multiple
 * rows. First row is the block name; each subsequent row is a single card whose one
 * cell holds text content (heading/title, description, optional CTA link).
 *
 * Here each source list item is a linked article: the anchor wraps a title and a
 * publish date. The whole card is a link, so the anchor is kept as the cell content
 * to preserve the href and the title/date semantics.
 */
export default function parse(element, { document }) {
  // Each <li> is one article card. Validated against .cmp-list--upnext source HTML.
  const items = Array.from(element.querySelectorAll('.cmp-list__item, li'));

  // Empty-block guard: bail gracefully if there are no article items.
  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    // The card is linked — prefer the item's anchor (holds title + date).
    const link = item.querySelector('.cmp-list__item-link, a');
    const content = link || item;
    // Single-column block: one cell per row holding the linked title + date.
    cells.push([content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-related', cells });
  element.replaceWith(block);
}
