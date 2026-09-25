import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Contributor / team profile grid.
 * Each row becomes a card: a circular avatar image cell and a body cell
 * holding the contributor's name (heading), occupation, and social links.
 * Authors may omit the image or the social links; decorate defensively.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-contributor-image';
      } else {
        div.className = 'cards-contributor-body';
      }
    });

    // Group the social links (a run of anchors, often icon links) so they can
    // be laid out as a horizontal row.
    const body = li.querySelector('.cards-contributor-body');
    if (body) {
      const socialLinks = [...body.querySelectorAll('a')];
      if (socialLinks.length > 1) {
        const social = document.createElement('p');
        social.className = 'cards-contributor-social';
        socialLinks.forEach((a) => social.append(a));
        body.append(social);
      }
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img
    .closest('picture')
    .replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  block.replaceChildren(ul);
}
