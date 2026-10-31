#!/usr/bin/env node
/* Builds index.html: one self-contained file (code, fonts and styles inside). Nothing is fetched when it runs.
   Usage:  node build.js        (needs Node 14 or newer; no npm packages)
   Edit src/config.js to rebrand, then run this again. */
const fs = require("fs"), path = require("path");
const S = path.join(__dirname, "src");
const rd = f => fs.readFileSync(path.join(S, f), "utf8");
const font = (f, mime) => "data:" + mime + ";base64," + fs.readFileSync(path.join(S, f)).toString("base64");
const fontCSS = [
  "@font-face{font-family:'Abhaya Libre';font-weight:500;src:url('" + font("fonts/AbhayaLibre-Medium.woff", "font/woff") + "')}",
  "@font-face{font-family:'Abhaya Libre';font-weight:600;src:url('" + font("fonts/AbhayaLibre-SemiBold.woff", "font/woff") + "')}",
  "@font-face{font-family:'Noto Sans';font-weight:100 900;src:url('" + font("fonts/NotoSans-Variable.woff", "font/woff") + "')}"
].join("");
const html = `<!DOCTYPE html>
<!--
  Collateral Maker - a single-file, no-server tool for making print-ready cards, vouchers and certificates.
  To rebrand without rebuilding, edit the CONFIG block just below, save, and reload this page.
  Licence: MIT (see LICENSE). Bundled third-party code and fonts: see NOTICE.md and the LICENSES folder.
-->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Collateral Maker</title>
<script>
${rd("config.js").trim()}
</script>
<style>${rd("maker.css")}</style></head><body>
<header class="top"><div class="brand" id="brandbar"></div><nav id="nav"></nav></header>
<div id="app"><p class="loading">Loading...</p></div>
<style id="fonts">${fontCSS}</style>
<script>${rd("vendor/qrcode.js")}</script><script>${rd("pieces.js")}</script><script>${rd("pdf.js")}</script>
<script>window.MAKER_ASSETS=${JSON.stringify({ fontCSS })};</script><script>${rd("maker.js")}</script></body></html>`;
fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("index.html built", (html.length / 1e6).toFixed(2) + " MB");
