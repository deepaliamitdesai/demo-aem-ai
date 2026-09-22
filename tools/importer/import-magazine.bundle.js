/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-magazine.js
  var import_magazine_exports = {};
  __export(import_magazine_exports, {
    default: () => import_magazine_default
  });

  // tools/importer/parsers/columns-byline.js
  function parse(element, { document: document2 }) {
    const image = element.querySelector(".cmp-byline__image img, .cmp-image__image, img");
    const name = element.querySelector('.cmp-byline__name, h2, [class*="name"]');
    const occupation = element.querySelector('.cmp-byline__occupations, [class*="occupation"], p');
    const socialLinks = Array.from(element.querySelectorAll(
      '.cmp-byline__social a, [class*="social"] a, [class*="share"] a'
    ));
    if (!image && !name && !occupation) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell1 = [];
    if (image) cell1.push(image);
    if (name) cell1.push(name);
    if (occupation) cell1.push(occupation);
    const cell2 = [];
    cell2.push(...socialLinks);
    const cells = [];
    cells.push([cell1, cell2.length ? cell2 : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-byline", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-related.js
  function parse2(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(".cmp-list__item, li"));
    if (!items.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const link = item.querySelector(".cmp-list__item-link, a");
      const content = link || item;
      cells.push([content]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-related", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#toggleNav",
        "#mobileNav",
        "iframe#destination_publishing_iframe_wkndsite_0"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        ".sharing",
        "iframe",
        "noscript",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-magazine.js
  var PAGE_TEMPLATE = {
    name: "magazine",
    description: "Magazine article page",
    urls: [
      "https://wknd.site/us/en/magazine/arctic-surfing.html",
      "https://wknd.site/us/en/magazine/ski-touring.html"
    ],
    blocks: [
      {
        name: "columns-byline",
        instances: [".cmp-byline"]
      },
      {
        name: "cards-related",
        instances: [".cmp-list--upnext"]
      }
    ],
    sections: [
      {
        id: "sec1",
        name: "Lead image",
        selector: [".image.aem-GridColumn"],
        style: null,
        blocks: [],
        defaultContent: [".image"]
      },
      {
        id: "sec2",
        name: "Breadcrumb",
        selector: [".breadcrumb.aem-GridColumn", ".cmp-breadcrumb"],
        style: null,
        blocks: [],
        defaultContent: [".cmp-breadcrumb"]
      },
      {
        id: "sec3",
        name: "Article body",
        selector: [".cmp-title", "main.aem-GridColumn--default--8 > .cmp-container"],
        style: null,
        blocks: [],
        defaultContent: [".cmp-title", ".cmp-text"]
      },
      {
        id: "sec4",
        name: "Author byline",
        selector: [".cmp-byline"],
        style: null,
        blocks: ["columns-byline"],
        defaultContent: []
      },
      {
        id: "sec5",
        name: "Related stories sidebar",
        selector: [".cmp-layoutcontainer--sidebar", "aside.responsivegrid > .cmp-container"],
        style: null,
        blocks: ["cards-related"],
        defaultContent: []
      }
    ]
  };
  var parsers = {
    "columns-byline": parse,
    "cards-related": parse2
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_magazine_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_magazine_exports);
})();
