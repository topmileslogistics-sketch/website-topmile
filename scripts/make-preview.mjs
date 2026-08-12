#!/usr/bin/env node
/**
 * Builds a self-contained, single-file HTML snapshot of a page.
 *
 * Fetches the rendered page from a running server and inlines every stylesheet
 * and script so the result opens anywhere with no server, no network and no
 * build step. Useful for showing someone the site before it is deployed.
 *
 * Usage: node scripts/make-preview.mjs <baseUrl> <path> <outFile> [linkMap.json]
 */
import { writeFileSync } from "node:fs";

const [, , base, pagePath, outFile, linkMapRaw] = process.argv;
if (!base || !pagePath || !outFile) {
  console.error(
    "Usage: node scripts/make-preview.mjs <baseUrl> <path> <outFile> [linkMapJson]",
  );
  process.exit(1);
}

const linkMap = linkMapRaw ? JSON.parse(linkMapRaw) : {};

const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.text();
};

let html = await get(`${base}${pagePath}`);

/*
 * Both inlining passes below replace every match in ONE go, driven by a
 * pre-fetched lookup.
 *
 * Doing it tag-by-tag with successive `html.replace(tag, ...)` calls is subtly
 * wrong: webpack's runtime contains the literal text of a script tag (it builds
 * them to load chunks), so once the first bundle is inlined, a later
 * `replace()` happily matches that text *inside the JavaScript* and corrupts
 * it. Collect first, substitute once.
 */

/* -- Inline stylesheets --------------------------------------------------- */
const cssRe = /<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
const cssHrefs = [...new Set([...html.matchAll(cssRe)].map((m) => m[1]))];
const cssByHref = new Map(
  await Promise.all(
    cssHrefs.map(async (href) => [
      href,
      await get(new URL(href, base).toString()),
    ]),
  ),
);
html = html.replace(cssRe, (_tag, href) => `<style>${cssByHref.get(href) ?? ""}</style>`);

// Next also emits preload hints for the same files; drop them.
html = html.replace(/<link[^>]+rel="preload"[^>]*>/g, "");

/* -- Inline scripts ------------------------------------------------------- */
const scriptRe = /<script[^>]*\ssrc="([^"]+)"[^>]*><\/script>/g;
const srcs = [...new Set([...html.matchAll(scriptRe)].map((m) => m[1]))];
const jsBySrc = new Map(
  await Promise.all(
    srcs.map(async (src) => {
      try {
        return [src, await get(new URL(src, base).toString())];
      } catch {
        return [src, ""];
      }
    }),
  ),
);
html = html.replace(scriptRe, (_tag, src) => {
  const js = jsBySrc.get(src) ?? "";
  // A literal closing tag inside the JS would end the <script> element early.
  return `<script>${js.replace(/<\/script>/gi, "<\\/script>")}</script>`;
});

/* -- Icons: no server to serve them, so drop the references --------------- */
html = html.replace(/<link[^>]+rel="(icon|apple-touch-icon)"[^>]*>/g, "");

/* -- Rewrite internal links ----------------------------------------------- */
for (const [from, to] of Object.entries(linkMap)) {
  html = html.replaceAll(`href="${from}"`, `href="${to}"`);
}

/*
 * Banner so nobody mistakes a snapshot for the live site.
 *
 * Added by script after load rather than written into the markup: React
 * compares the server-rendered HTML against what it expects during hydration,
 * and an extra element inside <body> trips a mismatch (error #418) that can
 * make the page fall back to client rendering.
 */
const banner = `
<script>
addEventListener("DOMContentLoaded", function () {
  var bar = document.createElement("div");
  bar.setAttribute("style",
    "position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#b45309;" +
    "color:#fff;padding:10px 16px;text-align:center;" +
    "font:600 13px/1.4 system-ui,-apple-system,sans-serif");
  bar.textContent =
    "Offline preview \\u2014 layout and copy are real. Submitting the form and " +
    "the recruiting dashboard need the deployed site.";
  document.body.appendChild(bar);
  document.body.style.paddingBottom = "56px";
});
</script>`;
html = html.replace("</body>", `${banner}</body>`);

writeFileSync(outFile, html);
console.log(
  `${outFile}: ${(html.length / 1024).toFixed(0)} KB, ` +
    `${cssHrefs.length} stylesheet(s) and ${srcs.length} script(s) inlined`,
);
