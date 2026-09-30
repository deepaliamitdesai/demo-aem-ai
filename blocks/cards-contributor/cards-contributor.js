import { createOptimizedPicture } from '../../scripts/aem.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* Self-contained social glyphs (no icon font / external dependency). */
const SOCIAL_ICONS = {
  facebook: {
    viewBox: '0 0 320 512',
    paths: ['M279.1 288l14.2-92.7h-88.9v-60.1c0-25.4 12.4-50.1 52.2-50.1h40.4V6.3S260.4 0 225.4 0c-73.2 0-121.1 44.4-121.1 124.7v70.6H22.9V288h81.4v224h100.2V288z'],
  },
  twitter: {
    viewBox: '0 0 24 24',
    paths: ['M23.95 4.57a10 10 0 0 1-2.82.78 4.96 4.96 0 0 0 2.16-2.73c-.95.56-2 .96-3.12 1.19a4.92 4.92 0 0 0-8.39 4.48C7.69 8.1 4.07 6.13 1.64 3.16a4.82 4.82 0 0 0-.66 2.48c0 1.71.87 3.21 2.19 4.1a4.9 4.9 0 0 1-2.23-.62v.06a4.92 4.92 0 0 0 3.95 4.83 5 5 0 0 1-2.21.08 4.94 4.94 0 0 0 4.6 3.42 9.87 9.87 0 0 1-6.1 2.1c-.39 0-.78-.02-1.17-.06a14 14 0 0 0 7.56 2.2c9.05 0 14-7.5 14-13.98 0-.21 0-.42-.02-.63A9.94 9.94 0 0 0 24 4.59z'],
  },
  instagram: {
    viewBox: '2 2 20 20',
    paths: [
      'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z',
      'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
      'M17.5 5.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z',
    ],
  },
};

function buildIcon(network) {
  const def = SOCIAL_ICONS[network];
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', def.viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('cards-contributor-social-icon', `cards-contributor-social-icon-${network}`);
  def.paths.forEach((d) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill-rule', 'evenodd');
    svg.append(path);
  });
  return svg;
}

/**
 * Turns a plain social text link (e.g. "Facebook") into a square icon button.
 * The authored text is kept (visually hidden) for assistive tech; unknown
 * networks fall back to a compact first-letter label.
 */
function decorateSocialLink(a) {
  const label = a.textContent.trim();
  const network = Object.keys(SOCIAL_ICONS)
    .find((key) => label.toLowerCase().includes(key) || a.href.toLowerCase().includes(key));

  const text = document.createElement('span');
  text.className = 'cards-contributor-social-label';
  text.textContent = label;

  let visual;
  if (network) {
    visual = buildIcon(network);
  } else {
    visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.className = 'cards-contributor-social-abbr';
    visual.textContent = label.charAt(0);
  }

  a.replaceChildren(visual, text);
}

/**
 * Contributor / team profile card(s).
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
    // be laid out as a horizontal row of square buttons.
    const body = li.querySelector('.cards-contributor-body');
    if (body) {
      const socialLinks = [...body.querySelectorAll('a')];
      if (socialLinks.length > 1) {
        const social = document.createElement('p');
        social.className = 'cards-contributor-social';
        socialLinks.forEach((a) => {
          const parent = a.parentElement;
          decorateSocialLink(a);
          social.append(a);
          // drop the paragraph the link came from if it is now empty
          if (parent !== body && !parent.children.length && !parent.textContent.trim()) {
            parent.remove();
          }
        });
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
