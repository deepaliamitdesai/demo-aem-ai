import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Related-articles "Up Next" list (no per-item images).
 * Each row becomes a list item holding a linked title + publish date.
 * The source renders the title and date as two visually distinct lines
 * (title: 18px dark; date: 12px grey uppercase). The imported content
 * merges them into a single link label, so we split the trailing date
 * (a weekday-prefixed date such as "Thursday, 9 Jul 2020") into its own
 * span for styling. Images are uncommon here but handled defensively.
 */
const DATE_RE = /\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+\d{1,2}\s+\w+\s+\d{4})\s*$/;

function splitTitleAndDate(anchor) {
  const label = anchor.textContent.trim();
  const match = label.match(DATE_RE);
  const title = match ? label.slice(0, match.index).trim() : label;
  const date = match ? match[1].trim() : '';

  anchor.textContent = '';
  const titleSpan = document.createElement('span');
  titleSpan.className = 'cards-related-title';
  titleSpan.textContent = title;
  anchor.append(titleSpan);

  if (date) {
    const dateSpan = document.createElement('span');
    dateSpan.className = 'cards-related-date';
    dateSpan.textContent = date;
    anchor.append(dateSpan);
  }
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-related-image';
      } else {
        div.className = 'cards-related-body';
      }
    });
    ul.append(li);
  });

  // Split each item's linked label into title + date spans.
  ul.querySelectorAll('.cards-related-body a').forEach((anchor) => {
    if (!anchor.querySelector('span')) splitTitleAndDate(anchor);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img
    .closest('picture')
    .replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  block.replaceChildren(ul);
}
