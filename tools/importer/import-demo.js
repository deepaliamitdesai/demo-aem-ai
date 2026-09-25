/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import demoCleanupTransformer from './transformers/demo-cleanup.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'demo',
  description: 'Standalone demo page imported as a DA page (default content only)',
  urls: [
    'https://aem-20260922-1827--demo-aem-ai--deepaliamitdesai.aem.page/demo1/main.html',
  ],
  blocks: [],
  sections: [],
};

// TRANSFORMER REGISTRY
const transformers = [demoCleanupTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup (no blocks on this page — default content only)
    executeTransformers('beforeTransform', main, payload);

    // 2. afterTransform cleanup
    executeTransformers('afterTransform', main, payload);

    // 3. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 4. Target path: the standalone /demo1/main.html becomes the DA page /demo.
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '')
      .replace(/^\/demo1\/main$/, '/demo');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [],
      },
    }];
  },
};
