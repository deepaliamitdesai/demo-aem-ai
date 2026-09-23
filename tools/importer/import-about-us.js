/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsContributorParser from './parsers/cards-contributor.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'about-us',
  description: 'About Us page: contributor profile grids',
  urls: [
    'https://wknd.site/us/en/about-us.html',
  ],
  blocks: [
    {
      name: 'cards-contributor',
      instances: ['.cmp-experience-fragment--contributor'],
    },
  ],
  sections: [
    {
      id: 'sec1', name: 'Page title', selector: ['.title:not(.cmp-title--underline) .cmp-title', 'main > .cmp-container > .aem-Grid > .title:nth-of-type(1)'], style: null, blocks: [], defaultContent: ['.cmp-title__text'],
    },
    {
      id: 'sec2', name: 'Our Contributors', selector: ['.cmp-title--underline', 'main .cmp-title--underline:nth-of-type(2)'], style: null, blocks: ['cards-contributor'], defaultContent: ['.cmp-title--underline .cmp-title__text', '.text.cmp-text--font-small'],
    },
    {
      id: 'sec3', name: 'WKND Guides', selector: ['main .cmp-title--underline:nth-of-type(4)'], style: null, blocks: ['cards-contributor'], defaultContent: ['.cmp-title--underline .cmp-title__text'],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'cards-contributor': cardsContributorParser,
};

// TRANSFORMER REGISTRY - cleanup first; sections after (only when 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

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

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by a prior parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup + section breaks
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Target path: map the source /us/en/about-us to /about-us as requested.
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '')
      .replace(/^\/us\/en\/about-us$/, '/about-us');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
