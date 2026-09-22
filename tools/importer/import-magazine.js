/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsBylineParser from './parsers/columns-byline.js';
import cardsRelatedParser from './parsers/cards-related.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'magazine',
  description: 'Magazine article page',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
    'https://wknd.site/us/en/magazine/ski-touring.html',
  ],
  blocks: [
    {
      name: 'columns-byline',
      instances: ['.cmp-byline'],
    },
    {
      name: 'cards-related',
      instances: ['.cmp-list--upnext'],
    },
  ],
  sections: [
    {
      id: 'sec1', name: 'Lead image', selector: ['.image.aem-GridColumn'], style: null, blocks: [], defaultContent: ['.image'],
    },
    {
      id: 'sec2', name: 'Breadcrumb', selector: ['.breadcrumb.aem-GridColumn', '.cmp-breadcrumb'], style: null, blocks: [], defaultContent: ['.cmp-breadcrumb'],
    },
    {
      id: 'sec3', name: 'Article body', selector: ['.cmp-title', 'main.aem-GridColumn--default--8 > .cmp-container'], style: null, blocks: [], defaultContent: ['.cmp-title', '.cmp-text'],
    },
    {
      id: 'sec4', name: 'Author byline', selector: ['.cmp-byline'], style: null, blocks: ['columns-byline'], defaultContent: [],
    },
    {
      id: 'sec5', name: 'Related stories sidebar', selector: ['.cmp-layoutcontainer--sidebar', 'aside.responsivegrid > .cmp-container'], style: null, blocks: ['cards-related'], defaultContent: [],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'columns-byline': columnsBylineParser,
  'cards-related': cardsRelatedParser,
};

// TRANSFORMER REGISTRY - cleanup runs first; sections runs after (only when 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
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

    // 6. Generate sanitized path (map root URL to /index defensively)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
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
