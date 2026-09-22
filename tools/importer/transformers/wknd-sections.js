/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks and section metadata.
 * Inserts an <hr> before each non-first section and a Section Metadata block
 * for each section that carries a style.
 *
 * Sections come from payload.template.sections (page-templates.json, magazine
 * template: 5 sections). All section selectors verified against
 * migration-work/cleaned.html:
 *   - sec1 Lead image           .image.aem-GridColumn                 (line 165)
 *   - sec2 Breadcrumb           .breadcrumb.aem-GridColumn / .cmp-breadcrumb (170-171)
 *   - sec3 Article body         .cmp-title / main...>.cmp-container    (189)
 *   - sec4 Author byline        .cmp-byline                           (284)
 *   - sec5 Related stories      .cmp-layoutcontainer--sidebar         (330)
 *
 * Breaks are inserted in beforeTransform (while every section element still
 * exists, before parsers replace them); metadata is anchored in afterTransform.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// section.selector is an array of candidate selectors — try each in order, first match wins.
function querySection(root, selectors) {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no break, no metadata needed
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue; // no selector matched on this page — skip, never guess a replacement

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now run and may have replaced section elements. Anchor each
    // styled section's Section Metadata block to whichever still exists: the
    // marker <hr> placed above, or (first section, no marker inserted) the
    // original element itself.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived — no selector matched post-parse; skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
