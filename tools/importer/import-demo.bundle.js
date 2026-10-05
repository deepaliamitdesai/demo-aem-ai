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

  // tools/importer/import-demo.js
  var import_demo_exports = {};
  __export(import_demo_exports, {
    default: () => import_demo_default
  });

  // tools/importer/transformers/demo-cleanup.js
  var ASSET_BASE = "https://main--demo-aem-ai--deepaliamitdesai.aem.page/demo1/";
  function transform(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const { document } = payload;
    WebImporter.DOMUtils.remove(element, ["script", "link", "style", "noscript"]);
    const back = element.querySelector(":scope > .back-to-site");
    if (back) {
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = "/";
      link.textContent = back.textContent.trim();
      p.append(link);
      const sectionMetadata = WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: { style: "demo-back" }
      });
      back.replaceWith(p, sectionMetadata, document.createElement("hr"));
    }
    element.querySelectorAll("button").forEach((button) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = button.textContent.trim();
      p.append(strong);
      button.replaceWith(p);
    });
    [["header", "demo-hero"], ["main", "demo-card"], ["footer", "demo-footer"]].forEach(([selector, style]) => {
      const part = element.querySelector(`:scope > ${selector}`);
      if (!part) return;
      const sectionMetadata = WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: { style }
      });
      part.replaceWith(...part.childNodes, sectionMetadata, document.createElement("hr"));
    });
    const last = element.lastElementChild;
    if (last && last.tagName === "HR") last.remove();
    element.querySelectorAll("img[src]").forEach((img) => {
      img.setAttribute("src", new URL(img.getAttribute("src"), ASSET_BASE).href);
    });
  }

  // tools/importer/import-demo.js
  var PAGE_TEMPLATE = {
    name: "demo",
    description: "Standalone demo page imported as a DA page (default content only)",
    urls: [
      "https://aem-20260922-1827--demo-aem-ai--deepaliamitdesai.aem.page/demo1/main.html"
    ],
    blocks: [],
    sections: []
  };
  var transformers = [transform];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var import_demo_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      const metadata = [...main.querySelectorAll("table")].find((table) => {
        var _a;
        return ((_a = table.querySelector("th, td")) == null ? void 0 : _a.textContent.trim()) === "Metadata";
      });
      if (metadata) {
        const row = document.createElement("tr");
        row.innerHTML = "<td>template</td><td>demo</td>";
        (metadata.querySelector("tbody") || metadata).append(row);
      }
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "").replace(/^\/demo1\/main$/, "/demo");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: []
        }
      }];
    }
  };
  return __toCommonJS(import_demo_exports);
})();
