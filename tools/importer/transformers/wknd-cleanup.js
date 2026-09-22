/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable site chrome and widgets so the import contains
 * only page-level authorable content.
 * All selectors verified against migration-work/cleaned.html.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / global nav toggles that could interfere with block parsing.
    // Verified in cleaned.html: #toggleNav (line 475), #mobileNav (line 481),
    // Adobe ID syncing tracking iframe (line 473).
    WebImporter.DOMUtils.remove(element, [
      '#toggleNav',
      '#mobileNav',
      'iframe#destination_publishing_iframe_wkndsite_0',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome. Verified in cleaned.html:
    // header experience fragment (line 5), footer experience fragment (line 378),
    // social sharing widget in the sidebar (.sharing / .fb-share-button, line 338-343),
    // any remaining tracking iframes and non-content elements.
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      '.sharing',
      'iframe',
      'noscript',
      'link',
    ]);
  }
}
