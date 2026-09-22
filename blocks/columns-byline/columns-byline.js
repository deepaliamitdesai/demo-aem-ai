/**
 * Author byline: circular avatar floated left, name + occupation to its right.
 * Structure after import: one row, two cells.
 *   Cell 1 (info)  = avatar image (in a <p>) + name (h2) + occupation (p)
 *   Cell 2 (share) = optional social share links (often authored as separate
 *                    default content, so this cell may be empty)
 * Authors may omit cells; decorate defensively.
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const [info, share] = [...row.children];

  if (info) {
    info.classList.add('columns-byline-info');

    // The avatar picture is wrapped in its own <p>. Tag that wrapper so it can
    // be floated and rounded independently of the name/occupation text.
    const pic = info.querySelector('picture');
    if (pic) {
      const wrapper = pic.closest('p') || pic.parentElement;
      if (wrapper && wrapper !== info) wrapper.classList.add('columns-byline-avatar');
    }
  }

  // Optional second cell holds social share links.
  if (share) share.classList.add('columns-byline-share');
}
