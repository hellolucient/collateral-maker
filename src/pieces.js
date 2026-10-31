/* Collateral designs. Brand settings come from CONFIG (src/config.js); nothing brand-specific lives in this file.
   Every design is plain HTML/CSS drawn in millimetres. Fill-in fields are listed in each piece's `fields`.
   Empty fields turn into a blank line for handwriting; text in [square brackets] is a placeholder
   and is tinted so nobody prints it by mistake. */
(function (root) {
  "use strict";
  var BLEED = 3, MARGIN = 10;                 // mm. Print sheet = trim + 10 mm each side (3 bleed + 7 for crop marks)
  var CFG = root.CONFIG || {}, CC = CFG.colors || {}, CF = CFG.fonts || {}, CL = CFG.logo || {};
  var BRAND = CFG.brandName || "Your Brand", TAGLINE = CFG.tagline || "", PLACE = CFG.location == null ? "Your City" : CFG.location;
  var FONT_HEAD = CF.heading || "'Abhaya Libre', Georgia, serif", FONT_BODY = CF.body || "'Noto Sans', Arial, sans-serif";
  // internal names kept short: gold = accent colour, cream = paper colour, mauve = highlight colour
  var C = { ink: CC.ink || "#2E3440", gold: CC.accent || "#6C7A89", cream: CC.paper || "#F7F7F5", band: CC.band || "#ECEDEA", mauve: CC.highlight || "#B4A58B", line: CC.line || "#D5D8D6" };
  function rgba(hex, a) { var h = String(hex).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var n = parseInt(h, 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  var PX = 25.4 / 96;                          // 1 CSS px in mm (used by the phone card, which is designed in px)

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function T(s) { return esc(s).replace(/\[[^\]]+\]/g, function (m) { return '<span class="ph">' + m + "</span>"; }); }
  function paras(s, cls) { return String(s || "").split(/\n+/).filter(Boolean).map(function (l) { return '<p class="' + (cls || "") + '">' + T(l) + "</p>"; }).join(""); }
  function mm(n) { return (Math.round(n * 1000) / 1000) + "mm"; }
  function px(n) { return mm(n * PX); }
  function logoH(w, which) { return which === "symbol" ? w * (CL.symbolRatio || 31 / 60) : w * (CL.wordmarkRatio || 56 / 142); }
  function logo(A, kind, w, extra) {
    var src = kind === "white" ? A.logoWhite : kind === "symbol" ? A.symbol : kind === "symbolWhite" ? A.symbolWhite : A.logoGold;
    var h = logoH(w, kind.indexOf("symbol") === 0 ? "symbol" : "logo");
    return '<img class="logo" src="' + src + '" style="width:' + mm(w) + ";height:" + mm(h) + ";" + (extra || "") + '" alt="' + esc(BRAND) + '">';
  }
  function photoStyle(A, name, pos) {
    var first = Object.keys(A.photos)[0];
    return "background-image:" + (A.photos[name] || A.photos[first] || "none") + ";background-color:" + C.gold + ";background-size:cover;background-position:" + (pos || "50% 50%");
  }
  // subtle repeating pattern for the footer strips (CONFIG.pattern: "dots", "lines" or "none"). Same 2:1 tile as before.
  function patternCss(stroke, size) {
    var kind = CFG.pattern || "dots"; if (kind === "none") return "background-image:none";
    var body = kind === "lines"
      ? '<g stroke="' + stroke + '" stroke-width="1"><path d="M-20 20L0 0M-10 20L10 0M0 20L20 0M10 20L30 0M20 20L40 0M30 20L50 0M40 20L60 0"/></g>'
      : '<g fill="' + stroke + '"><circle cx="5" cy="5" r="1.6"/><circle cx="15" cy="5" r="1.6"/><circle cx="25" cy="5" r="1.6"/><circle cx="35" cy="5" r="1.6"/><circle cx="0" cy="15" r="1.6"/><circle cx="10" cy="15" r="1.6"/><circle cx="20" cy="15" r="1.6"/><circle cx="30" cy="15" r="1.6"/><circle cx="40" cy="15" r="1.6"/></g>';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20">' + body + "</svg>";
    return "background-image:url('data:image/svg+xml," + encodeURIComponent(svg) + "');background-size:" + (size || "7mm 3.5mm");
  }
  // inline field: shows the value, or a blank line to write on
  function fld(v, minW, cls) { return v && String(v).trim() ? '<span class="fld ' + (cls || "") + '">' + T(v) + "</span>" : '<span class="fld blank ' + (cls || "") + '" style="min-width:' + minW + '"></span>'; }
  function qrBox(size, label, fs) {
    return '<div class="qr" style="width:' + mm(size) + ";height:" + mm(size) + (fs ? ";font-size:" + fs : "") + '"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><span>' + esc(label || "[QR code here]") + "</span></div>";
  }
  /* ---------- QR codes (encoder bundled in src/vendor/qrcode.js, MIT, no network use) ---------- */
  var QRG = root.qrcode || (typeof require !== "undefined" ? require("./vendor/qrcode.js") : null);
  if (QRG && QRG.stringToBytesFuncs) QRG.stringToBytes = QRG.stringToBytesFuncs["UTF-8"];   // links with accents or emoji stay correct
  // what the QR will actually hold. Empty or [bracketed] = not set yet (null). A bare web address gets https:// in front.
  function qrData(v) {
    v = String(v == null ? "" : v).trim();
    if (!v || /\[[^\]]*\]/.test(v)) return null;
    if (/^[a-z][a-z0-9+.\-]*:/i.test(v)) return v;
    if (!/\s/.test(v) && /\.[a-z]{2,}/i.test(v)) return "https://" + v;
    return v;
  }
  function qrMake(data) { var q = QRG(0, "M"); q.addData(data, "Byte"); q.make(); return q; }
  // vector QR with a 4-module quiet zone, drawn as one path; `size` is the whole square (quiet zone included) in mm
  function qrSvg(data, size) {
    var q = qrMake(data), n = q.getModuleCount(), t = n + 8, d = "", r, c, run;
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
      if (!q.isDark(r, c)) continue;
      run = 1; while (c + run < n && q.isDark(r, c + run)) run++;
      d += "M" + (c + 4) + " " + (r + 4) + "h" + run + "v1h-" + run + "z"; c += run - 1;
    }
    return '<svg class="qrsvg" width="' + mm(size) + '" height="' + mm(size) + '" viewBox="0 0 ' + t + " " + t + '" shape-rendering="crispEdges" style="display:block;flex:none"><rect width="' + t + '" height="' + t + '" fill="#fff"/><path d="' + d + '" fill="' + C.ink + '"/></svg>';
  }
  function qrInfo(v) {
    var data = qrData(v); if (!data) return null;
    var n = qrMake(data).getModuleCount(); return { data: data, modules: n, version: (n - 17) / 4 };
  }
  function qrCode(v, size, label, fs) { var data = qrData(v); return data ? qrSvg(data, size) : qrBox(size, label, fs); }
  function qrField(def, label, hint) { return { k: "qr", l: label || "QR code link", t: "url", d: def, hint: hint || "Paste any web address. The code on the card updates as you type, and the PDF and picture use the same code." }; }
  function qrLabelField(def) { return { k: "qrLabel", l: "Words next to the QR code", d: def }; }
  var uid = 0;
  function seal(A, size, topText, bottomText, tone) {
    uid++; var id = "seal" + uid, R = 50, ink = tone === "dark" ? C.cream : C.ink, fill = tone === "dark" ? "none" : C.cream;
    var d = ""; for (var a = 0; a <= 360; a += 2) { var r = 47 + 1.6 * Math.cos(a * Math.PI / 180 * 22), x = 50 + r * Math.cos(a * Math.PI / 180), y = 50 + r * Math.sin(a * Math.PI / 180); d += (a ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2); }
    var sym = tone === "dark" ? A.symbolWhite : A.symbol;
    return '<svg class="seal" viewBox="0 0 100 100" style="width:' + mm(size) + ";height:" + mm(size) + '"><defs>' +
      '<path id="' + id + 't" d="M 17 50 A 33 33 0 0 1 83 50"/><path id="' + id + 'b" d="M 14.5 50 A 35.5 35.5 0 0 0 85.5 50"/></defs>' +
      '<path d="' + d + 'Z" fill="' + fill + '" stroke="' + ink + '" stroke-width="1.1"/><circle cx="50" cy="50" r="40" fill="none" stroke="' + ink + '" stroke-width=".6"/><circle cx="50" cy="50" r="26.5" fill="none" stroke="' + ink + '" stroke-width=".6"/>' +
      '<text font-family="' + esc(FONT_BODY) + '" font-weight="600" font-size="6.6" letter-spacing="1.9" fill="' + ink + '" text-anchor="middle"><textPath href="#' + id + 't" startOffset="50%">' + esc((topText || "").toUpperCase()) + "</textPath></text>" +
      '<text font-family="' + esc(FONT_BODY) + '" font-weight="600" font-size="6.6" letter-spacing="1.9" fill="' + ink + '" text-anchor="middle"><textPath href="#' + id + 'b" startOffset="50%">' + esc((bottomText || "").toUpperCase()) + "</textPath></text>" +
      '<image href="' + sym + '" x="34" y="39.5" width="32" height="16.5"/>' +
      '<g fill="' + ink + '"><circle cx="19" cy="50" r="1.1"/><circle cx="81" cy="50" r="1.1"/></g></svg>';
  }

  /* ---------- shared fields (the "Your business" strip in the maker) ---------- */
  var WEBSITE = String(CFG.website || "yourbrand.com").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  var SHARED = [
    { k: "brand", l: "Business name", d: BRAND, hint: "Appears in the words, for example \"The " + BRAND + " team\"." },
    { k: "place", l: "Location or branch", d: "[Location]", hint: "Shown after the business name. Leave as the bracket until you know." },
    { k: "phone", l: "Phone", d: "[phone number]" },
    { k: "email", l: "Contact email", d: "[contact email]" }
  ];
  var PHOTOS = (CFG.images || []).map(function (x) { return [x.id, x.label]; });   // the maker adds "custom" when someone uploads a photo
  function venueLine(f) { return (f.brand || BRAND) + (f.place ? " \u00b7 " + f.place : ""); }

  /* ---------- logos and pictures (drawn from CONFIG; nothing is fetched) ---------- */
  function b64(str) { return btoa(unescape(encodeURIComponent(str))); }
  function svgUri(svg) { return "data:image/svg+xml;base64," + b64(svg); }
  function asSrc(v) { return /^\s*<svg/i.test(v) ? svgUri(v) : v; }
  function initials() { return BRAND.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase() || "B"; }
  function autoWordmark(color) {
    var name = BRAND.toUpperCase(), fs = Math.max(6, Math.min(20, 128 / (name.length * 0.86)));
    return '<svg xmlns="http://www.w3.org/2000/svg" width="142" height="56" viewBox="0 0 142 56"><text x="71" y="31" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-size="' + fs.toFixed(1) + '" letter-spacing="' + (fs * 0.12).toFixed(2) + '" fill="' + color + '">' + esc(name) + '</text><path d="M56 41h30" stroke="' + color + '" stroke-width=".9"/></svg>';
  }
  function autoSymbol(color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="31" viewBox="0 0 60 31"><rect x="1" y="1" width="58" height="29" rx="14.5" fill="none" stroke="' + color + '" stroke-width="1.4"/><text x="30" y="21" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-size="15" fill="' + color + '">' + esc(initials()) + "</text></svg>";
  }
  // everything the designs need besides the fonts: four logo images and the picture backgrounds
  function brandAssets() {
    var A = {
      logoGold: CL.onLight ? asSrc(CL.onLight) : svgUri(autoWordmark(C.gold)),
      logoWhite: CL.onDark ? asSrc(CL.onDark) : svgUri(autoWordmark("#FFFFFF")),
      symbol: CL.symbolOnLight ? asSrc(CL.symbolOnLight) : svgUri(autoSymbol(C.gold)),
      symbolWhite: CL.symbolOnDark ? asSrc(CL.symbolOnDark) : svgUri(autoSymbol("#FFFFFF")),
      photos: {}
    };
    (CFG.images || []).forEach(function (x) { A.photos[x.id] = x.src ? "url('" + x.src + "')" : (x.background || C.gold); });
    return A;
  }
  function photoField(def) { return { k: "photo", l: "Picture", t: "select", o: PHOTOS, d: def }; }

  /* ---------- CSS (all designs) ---------- */
  function css(A) {
    return (A.fontCSS || "") + "\n" +
      "*{box-sizing:border-box;margin:0;padding:0}html,body{background:#fff}" +
      "body,.rootwrap{font-family:" + FONT_BODY + ";color:" + C.ink + ";-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
      ".sheet{position:relative;overflow:hidden;background:#fff}" +
      ".bleedbox{position:absolute;overflow:hidden}.trim{position:absolute}" +
      ".abs{position:absolute}.ctr{text-align:center}" +
      ".serif{font-family:" + FONT_HEAD + ";font-weight:500}" +
      ".caps{text-transform:uppercase;letter-spacing:.26em;font-weight:600}" +
      ".ph{color:#9A5F58;background:rgba(176,146,142,.2);border-radius:.5mm;padding:0 .4mm}" +
      ".dark .ph{color:#F1D3CD;background:rgba(176,146,142,.28)}" +
      ".fld{display:inline-block;border-bottom:.25mm solid " + C.gold + ";min-height:1.2em;line-height:1.25;vertical-align:bottom;padding:0 .8mm}" +
      ".fld.blank{color:transparent}.dark .fld{border-bottom-color:" + C.line + "}" +
      ".logo{display:block}.photo{position:absolute}" +
      ".qr{position:relative;border:.3mm dashed " + C.gold + ";display:flex;align-items:center;justify-content:center;text-align:center;font-size:6.5pt;line-height:1.3;color:#9A5F58;background:rgba(176,146,142,.08);padding:2mm;flex:none}" +
      ".qr i{position:absolute;width:3.2mm;height:3.2mm;border:0 solid " + C.ink + "}.qr .c1{left:1.2mm;top:1.2mm;border-width:.5mm 0 0 .5mm}.qr .c2{right:1.2mm;top:1.2mm;border-width:.5mm .5mm 0 0}.qr .c3{left:1.2mm;bottom:1.2mm;border-width:0 0 .5mm .5mm}.qr .c4{right:1.2mm;bottom:1.2mm;border-width:0 .5mm .5mm 0}" +
      ".strip{position:absolute;left:-3mm;right:-3mm}" +
      ".circ{width:6.4mm;height:6.4mm;border:.3mm solid " + C.gold + ";border-radius:50%;font-size:7pt;line-height:6mm;text-align:center;color:" + C.gold + ";font-weight:600}" +
      ".wline{border-bottom:.25mm solid " + C.line + ";height:7.4mm}" +
      ".seal{display:block}" +
      ".tt{white-space:pre-line}";
  }

  /* ---------- the designs ---------- */
  var P = {};

  /* 1. REVIEW CARD  A6 portrait 105 x 148 */
  P.review = {
    item: "review-card", name: "Review card", w: 105, h: 148, print: true,
    fields: [
      { k: "headline", l: "Headline", d: "How was your time with us?" },
      { k: "intro", l: "Invitation", t: "textarea", d: "Thank you for choosing us. If you have a few minutes, we would love to hear how it went. Your words help our team look after every customer a little better." },
      qrField("[paste your Google review link here]", "QR code link (your review page)", "Paste the link to your Google or TripAdvisor review page. Until then the card shows a dashed box."),
      { k: "qrLabel", l: "Words next to the QR code", d: "Scan to share your review" },
      { k: "qrNote", l: "Small note under it", d: "[review page or platform to be confirmed]" },
      { k: "scale", l: "Add the tick scale on the back", t: "check", d: true },
      { k: "r1", l: "Tick line 1", d: "Our team" }, { k: "r2", l: "Tick line 2", d: "Your service" }, { k: "r3", l: "Tick line 3", d: "The atmosphere" },
      photoField("sage")
    ],
    sides: [
      { name: "front", bg: C.cream, html: function (f, A) {
        return '<div class="photo" style="left:-3mm;top:-3mm;width:111mm;height:52mm;' + photoStyle(A, f.photo, "50% 55%") + '"></div>' +
          '<div class="abs" style="left:-3mm;top:-3mm;width:111mm;height:52mm;background:linear-gradient(180deg,rgba(20,22,26,.5),rgba(20,22,26,0) 60%)"></div>' +
          '<div class="abs" style="left:0;top:7mm;width:105mm">' + logo(A, "white", 30, "margin:0 auto") + "</div>" +
          '<div class="abs ctr" style="left:9mm;right:9mm;top:54mm;height:73mm;display:flex;flex-direction:column;justify-content:space-between">' +
            '<div><h1 class="serif" style="font-size:22pt;line-height:1.08;color:' + C.ink + '">' + T(f.headline) + "</h1>" +
            '<div style="width:10mm;height:.35mm;background:' + C.mauve + ';margin:3mm auto 3mm"></div>' +
            '<p style="font-size:8.6pt;line-height:1.45;color:' + C.ink + '">' + T(f.intro) + "</p></div>" +
            '<div style="display:flex;align-items:center;gap:4.5mm;text-align:left;justify-content:center">' + qrCode(f.qr, 28, "[QR code: paste review link]") +
              '<div style="max-width:42mm"><div class="serif" style="font-size:13pt;line-height:1.1">' + T(f.qrLabel) + '</div><div style="font-size:6.6pt;line-height:1.4;margin-top:1.6mm;color:' + C.gold + '">' + T(f.qrNote) + "</div></div></div></div>" +
          '<div class="strip" style="bottom:-3mm;height:16mm;background-color:' + C.band + ";" + patternCss(C.line) + '"></div>' +
          '<div class="abs caps ctr" style="left:0;right:0;bottom:5.2mm;font-size:5.6pt;letter-spacing:.22em;color:' + C.gold + '">' + T(venueLine(f)) + "</div>";
      } },
      { name: "back", bg: C.cream, html: function (f, A) {
        var circles = function () { var s = ""; for (var i = 1; i <= 5; i++) s += '<div class="circ">' + i + "</div>"; return s; };
        var row = function (t) { return '<div style="display:flex;align-items:center;justify-content:space-between;padding:2.4mm 0;border-bottom:.2mm solid ' + C.line + '"><div style="font-size:8.6pt;font-weight:600;width:30mm">' + T(t) + '</div><div style="display:flex;gap:1.9mm">' + circles() + "</div></div>"; };
        var body = "";
        if (f.scale) body += '<div style="font-size:7pt;color:' + C.gold + ';margin-bottom:1mm;display:flex;justify-content:space-between"><span>1 = could be better</span><span>5 = wonderful</span></div>' + row(f.r1) + row(f.r2) + row(f.r3);
        var lines = f.scale ? 4 : 8;
        body += '<div class="serif" style="font-size:12pt;margin:' + (f.scale ? "4.5mm" : "1mm") + ' 0 1mm">Anything you would like to tell us?</div>';
        for (var i = 0; i < lines; i++) body += '<div class="wline"></div>';
        body += '<div style="display:flex;gap:4mm;font-size:6.8pt;color:' + C.gold + ';margin-top:3mm"><div style="flex:1">Name (optional)<div class="wline" style="height:5.5mm"></div></div><div style="flex:1">Room or date (optional)<div class="wline" style="height:5.5mm"></div></div></div>';
        return '<div class="abs" style="left:0;right:0;top:8mm">' + logo(A, "symbol", 11, "margin:0 auto") + "</div>" +
          '<div class="abs ctr serif" style="left:0;right:0;top:21mm;font-size:17pt;line-height:1">A few quick words</div>' +
          '<div class="abs ctr" style="left:12mm;right:12mm;top:29.5mm;font-size:7.4pt;color:' + C.gold + '">' + (f.scale ? "Tick one circle on each line, if you would like to." : "Write as much or as little as you like.") + "</div>" +
          '<div class="abs" style="left:11mm;right:11mm;top:38mm">' + body + "</div>" +
          '<div class="strip" style="bottom:-3mm;height:13mm;background-color:' + C.band + ";" + patternCss(C.line) + '"></div>' +
          '<div class="abs ctr serif" style="left:0;right:0;bottom:5.4mm;font-size:10pt;color:' + C.ink + '">Thank you. We hope to see you again.</div>';
      } }
    ]
  };

  /* 2. WELCOME POSTCARD  150 x 100 (same size as the earlier partner postcards) */
  P.postcard = {
    item: "welcome-postcard", name: "Welcome postcard", w: 150, h: 100, print: true,
    fields: [
      { k: "greeting", l: "Greeting (leave empty to write by hand)", d: "Dear customer," },
      { k: "message", l: "Message", t: "textarea", d: "Welcome, and thank you for choosing us.\nOur team is here to help you enjoy your visit. If there is anything you need, or you would like some advice on what suits you, please ask.\nWe would love to look after you." },
      { k: "signoff", l: "Sign-off", d: "With warm wishes," },
      { k: "signName", l: "Signed by (name)", d: "[Name]" }, { k: "signTitle", l: "Signed by (title)", d: "[Title]" },
      { k: "hours", l: "Opening hours", d: "[opening hours]" },
      qrField("https://" + WEBSITE, "QR code link (back of the card)"), qrLabelField("Scan to visit us"),
      photoField("dusk")
    ],
    sides: [
      { name: "front", bg: C.gold, html: function (f, A) {
        return '<div class="photo" style="left:-3mm;top:-3mm;right:-3mm;bottom:-3mm;' + photoStyle(A, f.photo, "50% 50%") + '"></div>' +
          '<div class="abs" style="left:-3mm;top:-3mm;right:-3mm;bottom:-3mm;background:linear-gradient(180deg,rgba(20,22,26,.18),rgba(20,22,26,0) 40%)"></div>' +
          '<div class="abs ctr" style="left:37mm;width:76mm;bottom:-3mm;height:49mm;background:' + C.cream + ';border-radius:38mm 38mm 0 0;padding-top:7mm">' +
            logo(A, "gold", 26, "margin:0 auto") +
            '<div class="serif" style="font-size:20pt;line-height:1;margin-top:3.2mm;color:' + C.ink + '">Welcome</div>' +
            '<div style="width:9mm;height:.3mm;background:' + C.mauve + ';margin:2.2mm auto"></div>' +
            '<div class="serif" style="font-size:7.4pt;line-height:1.35;color:' + C.gold + ';padding:0 7mm">' + T(TAGLINE) + "</div></div>";
      } },
      { name: "back", bg: C.cream, html: function (f, A) {
        return '<div class="abs" style="left:11mm;top:9mm;width:84mm;height:76mm;display:flex;flex-direction:column">' +
            '<div class="serif" style="font-size:12.5pt;margin-bottom:2.4mm">' + (f.greeting ? T(f.greeting) : '<span class="fld blank" style="width:40mm"></span>') + "</div>" +
            '<div style="font-size:7.9pt;line-height:1.5">' + String(f.message || "").split(/\n+/).filter(Boolean).map(function (l) { return '<p style="margin-bottom:1.8mm">' + T(l) + "</p>"; }).join("") + "</div>" +
            '<div style="margin-top:auto;font-size:7.9pt">' + T(f.signoff) + "</div>" +
            '<div style="height:10mm"></div><div style="width:56mm;border-top:.25mm solid ' + C.gold + ';padding-top:1.2mm;font-size:7.4pt;line-height:1.35"><b>' + T(f.signName) + '</b><br><span style="color:' + C.gold + '">' + T(f.signTitle) + ", " + T(venueLine(f)) + "</span></div></div>" +
          '<div class="abs" style="left:103mm;top:9mm;bottom:18mm;width:.25mm;background:' + C.line + '"></div>' +
          '<div class="abs ctr" style="left:107mm;width:36mm;top:9mm">' + logo(A, "symbol", 12, "margin:0 auto") +
            '<div class="caps" style="font-size:5.4pt;margin-top:3mm;color:' + C.gold + '">' + esc(BRAND) + "</div>" +
            '<div class="caps" style="font-size:5pt;margin-top:5mm;color:' + C.gold + '">Opening hours</div><div style="font-size:6.5pt;line-height:1.5;margin-top:.8mm">' + T(f.hours) + "</div>" +
            '<div class="caps" style="font-size:5pt;margin-top:4mm;color:' + C.gold + '">To book</div><div style="font-size:6.5pt;line-height:1.5;margin-top:.8mm">' + T(f.phone) + "<br>" + T(f.email) + "<br>" + WEBSITE + "</div></div>" +
          '<div class="abs ctr" style="left:107mm;width:36mm;top:55mm;display:flex;flex-direction:column;align-items:center">' + qrCode(f.qr, 22, "[QR code: paste link]", "6pt") +
            '<div style="font-size:5.6pt;line-height:1.3;color:' + C.gold + ';margin-top:.6mm">' + T(f.qrLabel) + "</div></div>" +
          '<div class="strip" style="bottom:-3mm;height:12mm;background-color:' + C.band + ";" + patternCss(C.line) + '"></div>';
      } }
    ]
  };

  /* 3a. GIFT CARD  85.6 x 54 */
  P.giftcard = {
    item: "gift-card-and-voucher", name: "Gift card", w: 85.6, h: 54, print: true,
    fields: [
      { k: "value", l: "Value or service", d: "[value or service]" },
      { k: "cardNo", l: "Card number", d: "[card no.]" },
      { k: "valid", l: "Valid until", t: "date", d: "[valid until]" },
      qrField("https://" + WEBSITE, "QR code link (back of the card)"), qrLabelField("Scan to visit us"),
      { k: "terms", l: "Terms and conditions", t: "textarea", d: "[Terms and conditions to be confirmed before printing: validity, booking, transfer, cash and tax rules.]" },
      photoField("ink")
    ],
    sides: [
      { name: "front", bg: C.ink, html: function (f, A) {
        return '<div class="photo" style="left:-3mm;top:-3mm;right:-3mm;bottom:-3mm;' + photoStyle(A, f.photo, "50% 60%") + '"></div>' +
          '<div class="abs" style="left:-3mm;top:-3mm;right:-3mm;bottom:-3mm;background:linear-gradient(180deg,rgba(20,22,26,.46),rgba(20,22,26,.58))"></div>' +
          '<div class="abs" style="left:0;right:0;top:11.5mm">' + logo(A, "white", 30, "margin:0 auto") + "</div>" +
          '<div class="abs" style="left:34mm;width:17.6mm;top:30mm;height:.3mm;background:' + C.mauve + '"></div>' +
          '<div class="abs caps ctr" style="left:0;right:0;top:34.2mm;font-size:8pt;letter-spacing:.42em;color:' + C.cream + '">Gift Card</div>' +
          '<div class="abs ctr" style="left:0;right:0;bottom:5mm;font-size:4.6pt;letter-spacing:.3em;text-transform:uppercase;color:' + rgba(C.cream, .8) + '">' + esc(PLACE) + "</div>";
      } },
      { name: "back", bg: C.cream, html: function (f, A) {
        var lab = function (t) { return '<div class="caps" style="font-size:4.4pt;color:' + C.gold + ';letter-spacing:.22em">' + t + "</div>"; };
        var val = function (v, w) { return '<div style="font-size:7pt;font-weight:600;border-bottom:.25mm solid ' + C.gold + ';padding:.4mm 0;min-height:4mm;width:' + w + '">' + (v && String(v).trim() ? T(v) : "") + "</div>"; };
        return '<div class="abs" style="left:6mm;top:5mm">' + logo(A, "gold", 18) + "</div>" +
          '<div class="abs caps" style="right:6mm;top:6.4mm;font-size:5.4pt;letter-spacing:.3em;color:' + C.gold + '">Gift Card</div>' +
          '<div class="abs" style="left:6mm;top:16mm;width:50mm;display:flex;flex-wrap:wrap;gap:2mm 3mm">' +
            '<div style="flex:1 1 100%">' + lab("Redeemable for") + val(f.value, "100%") + "</div>" +
            '<div style="flex:1">' + lab("Card number") + val(f.cardNo, "100%") + '</div><div style="flex:1">' + lab("Valid until") + val(f.valid, "100%") + "</div></div>" +
          '<div class="abs ctr" style="left:59mm;width:22mm;top:12.5mm;display:flex;flex-direction:column;align-items:center">' + qrCode(f.qr, 21, "[QR code: paste link]", "5pt") +
            '<div style="font-size:4.4pt;line-height:1.2;color:' + C.gold + '">' + T(f.qrLabel) + "</div></div>" +
          '<div class="abs" style="left:6mm;right:6mm;top:38.5mm;font-size:5pt;line-height:1.4;color:' + C.ink + '">' + T(f.terms) + "</div>" +
          '<div class="strip" style="bottom:-3mm;height:7mm;background-color:' + C.band + ";" + patternCss(C.line, "5mm 2.5mm") + '"></div>' +
          '<div class="abs caps ctr" style="left:0;right:0;bottom:2.2mm;font-size:4.2pt;letter-spacing:.2em;color:' + C.gold + '">' + T(venueLine(f)) + "</div>";
      } }
    ]
  };
  // fix a quote slip safely (kept as a function so the file still reads clearly)
  /* 3b. GIFT VOUCHER  DL 210 x 99 */
  P.voucher = {
    item: "gift-card-and-voucher", name: "Gift voucher", w: 210, h: 99, print: true,
    fields: [
      { k: "recipient", l: "For (recipient)", d: "[recipient name]" },
      { k: "service", l: "Redeemable for", d: "[service or value]" },
      { k: "from", l: "From", d: "[from]" },
      { k: "message", l: "Gift message (optional)", d: "" },
      { k: "voucherNo", l: "Voucher number", d: "[voucher no.]" },
      { k: "valid", l: "Valid until", t: "date", d: "[valid until]" },
      { k: "issued", l: "Date of issue", t: "date", d: "[date of issue]" },
      { k: "issuedBy", l: "Issued by", d: "[issued by]" },
      qrField("https://" + WEBSITE, "QR code link (back of the voucher)"), qrLabelField("Scan to visit our website"),
      { k: "howto", l: "How to use it (back)", t: "textarea", d: "[How to book: phone / email / front desk]\n[What to bring or show on arrival]\n[Any notice needed before the visit]" },
      { k: "terms", l: "Terms and conditions", t: "textarea", d: "[Terms and conditions to be confirmed before printing.]\n[Validity: how long the voucher can be used]\n[Transfer, cash value and refund rules]\n[Service charge and government tax: included or extra]\n[Service cannot be changed after issue: yes or no]" },
      photoField("clay")
    ],
    sides: [
      { name: "front", bg: C.cream, html: function (f, A) {
        var row = function (lab, v, w) { return '<div style="margin-bottom:3.6mm"><div class="caps" style="font-size:5pt;letter-spacing:.22em;color:' + C.gold + '">' + lab + '</div><div style="font-size:9.4pt;font-weight:600;border-bottom:.25mm solid ' + C.gold + ';padding:.6mm 0;min-height:5.8mm;width:' + w + '">' + (v && String(v).trim() ? T(v) : "") + "</div></div>"; };
        var small = function (lab, v) { return '<div style="flex:1"><div class="caps" style="font-size:4.6pt;letter-spacing:.2em;color:' + C.gold + '">' + lab + '</div><div style="font-size:7.6pt;font-weight:600;border-bottom:.25mm solid ' + C.gold + ';padding:.4mm 0;min-height:4.8mm">' + (v && String(v).trim() ? T(v) : "") + "</div></div>"; };
        return '<div class="photo" style="left:-3mm;top:-3mm;width:76mm;bottom:-3mm;' + photoStyle(A, f.photo, "62% 50%") + '"></div>' +
          '<div class="abs" style="left:-3mm;top:-3mm;width:76mm;bottom:-3mm;background:linear-gradient(180deg,rgba(20,22,26,.12),rgba(20,22,26,.34))"></div>' +
          '<div class="abs" style="left:11mm;top:10mm;width:54mm">' + logo(A, "white", 34) + "</div>" +
          '<div class="abs caps" style="left:11mm;bottom:9mm;font-size:5pt;letter-spacing:.3em;color:' + C.cream + '">' + esc(PLACE) + "</div>" +
          '<div class="abs" style="left:73mm;right:0;top:0;bottom:0"><div class="strip" style="left:0;right:-3mm;bottom:-3mm;height:9mm;background-color:' + C.band + ";" + patternCss(C.line) + '"></div></div>' +
          '<div class="abs" style="left:88mm;right:12mm;top:7mm;height:76mm;display:flex;flex-direction:column">' +
            '<div class="caps" style="font-size:6pt;letter-spacing:.34em;color:' + C.gold + '">' + T(venueLine(f)) + "</div>" +
            '<div class="serif" style="font-size:30pt;line-height:1;margin:2mm 0 4.6mm">Gift Voucher</div>' +
            row("This voucher is for", f.recipient, "100%") + row("Redeemable for", f.service, "100%") +
            '<div style="display:flex;gap:5mm">' + small("From", f.from) + small("Voucher no.", f.voucherNo) + "</div>" +
            '<div style="display:flex;gap:5mm;margin-top:3mm">' + small("Valid until", f.valid) + small("Date of issue", f.issued) + small("Issued by", f.issuedBy) + "</div>" +
            '<div style="margin-top:3.4mm"><div class="caps" style="font-size:4.6pt;letter-spacing:.2em;color:' + C.gold + '">Message</div><div style="font-size:8pt;border-bottom:.25mm solid ' + C.gold + ';padding:.4mm 0;min-height:5mm">' + (f.message && String(f.message).trim() ? T(f.message) : "") + "</div></div></div>";
      } },
      { name: "back", bg: C.cream, html: function (f, A) {
        var ul = function (s) { return String(s || "").split(/\n+/).filter(Boolean).map(function (l) { return '<div style="display:flex;gap:2mm;margin-bottom:1.3mm"><span style="color:' + C.mauve + '">&bull;</span><span>' + T(l) + "</span></div>"; }).join(""); };
        return '<div class="abs" style="left:12mm;top:9mm;width:98mm"><div class="serif" style="font-size:16pt;line-height:1">Using your voucher</div><div style="width:10mm;height:.35mm;background:' + C.mauve + ';margin:2.4mm 0 3mm"></div><div style="font-size:8.6pt;line-height:1.5">' + ul(f.howto) + "</div>" +
            '<div class="caps" style="font-size:5pt;margin-top:4mm;color:' + C.gold + '">To book</div><div style="font-size:8.6pt;line-height:1.55;margin-top:.8mm">' + T(f.phone) + " &middot; " + T(f.email) + "<br>" + WEBSITE + "</div></div>" +
          '<div class="abs" style="left:12mm;top:57mm;display:flex;align-items:center;gap:4mm">' + qrCode(f.qr, 26, "[QR code: paste link]", "6.5pt") +
            '<div class="serif" style="font-size:11pt;line-height:1.15;max-width:46mm">' + T(f.qrLabel) + "</div></div>" +
          '<div class="abs" style="left:117mm;top:9mm;bottom:15mm;width:.25mm;background:' + C.line + '"></div>' +
          '<div class="abs" style="left:124mm;right:12mm;top:9mm"><div class="caps" style="font-size:5.4pt;color:' + C.gold + ';margin-bottom:2mm">Terms and conditions</div><div style="font-size:7.2pt;line-height:1.5">' + ul(f.terms) + "</div></div>" +
          '<div class="strip" style="bottom:-3mm;height:12mm;background-color:' + C.band + ";" + patternCss(C.line) + '"></div>' +
          '<div class="abs" style="left:12mm;bottom:3.4mm">' + logo(A, "gold", 18) + "</div>" +
          '<div class="abs caps" style="right:12mm;bottom:5mm;font-size:5pt;color:' + C.gold + '">Gift Voucher</div>';
      } }
    ]
  };

  /* 4. CERTIFICATES  A4 landscape 297 x 210 */
  function certPiece(kind) {
    var award = kind === "award";
    var d = award ? {
      title: "Employee of the Month", pre: "Proudly presented to", sealTop: BRAND, sealBottom: "Award", style: "dark",
      cite: "In recognition of [reason for the award]. Thank you for the care you give our customers and for the way you support the team.", forLine: "[Month and year]"
    } : {
      title: "Certificate of Excellence", pre: "Is proudly presented to", sealTop: BRAND, sealBottom: "Excellence", style: "light",
      cite: "In recognition of your care, professionalism and the warmth you bring to our customers and to your colleagues. Thank you for being part of the team.", forLine: ""
    };
    return {
      item: "certificates", name: award ? "Award certificate" : "Certificate of Excellence", w: 297, h: 210, print: true, certKind: kind,
      fields: [
        { k: "title", l: "Certificate title", d: d.title, hint: award ? "For example Employee of the Month, Team Member of the Year, Business of the Year." : "" },
        { k: "pre", l: "Line above the name", d: d.pre },
        { k: "name", l: "Name", d: "[Full name]" },
        { k: "role", l: "Job title", d: "[Job title]" },
        { k: "forLine", l: award ? "Month, year or category" : "Month or year (optional)", d: d.forLine },
        { k: "cite", l: "Citation", t: "textarea", d: d.cite },
        { k: "date", l: "Date", t: "date", d: "[date]" },
        { k: "s1n", l: "Signatory 1 name", d: "[Name]" }, { k: "s1t", l: "Signatory 1 title", d: "[Title]" },
        { k: "s2n", l: "Signatory 2 name", d: "[Name]" }, { k: "s2t", l: "Signatory 2 title", d: "[Title]" },
        { k: "sealTop", l: "Seal text (top)", d: d.sealTop }, { k: "sealBottom", l: "Seal text (bottom)", d: d.sealBottom },
        { k: "style", l: "Look", t: "select", o: [["light", "Light (saves ink)"], ["dark", "Dark"]], d: d.style }
      ],
      sides: [{ name: "page", bg: C.cream, bgFn: function (f) { return f.style === "dark" ? C.ink : C.cream; }, html: function (f, A) {
        var dark = f.style === "dark", fg = dark ? C.cream : C.ink, acc = dark ? C.line : C.gold, mau = C.mauve;
        var frame = dark ? rgba(C.line,.85) : C.ink;
        var patternStroke = dark ? "rgba(255,255,255,.07)" : rgba(C.gold,.14);
        var sig = function (n, t) { return '<div style="width:62mm;text-align:center"><div style="height:11mm;display:flex;align-items:flex-end;justify-content:center;font-size:10pt;font-weight:600;color:' + fg + ';padding-bottom:1mm">' + (n && String(n).trim() ? T(n) : "") + '</div><div style="border-top:.3mm solid ' + acc + ';padding-top:1.6mm;font-size:8pt;color:' + acc + '">' + T(t) + "</div></div>"; };
        return '<div class="abs" style="left:-3mm;right:-3mm;bottom:-3mm;height:50mm;' + patternCss(patternStroke, "28mm 14mm") + ';-webkit-mask-image:linear-gradient(180deg,transparent,#000 70%);mask-image:linear-gradient(180deg,transparent,#000 70%)"></div>' +
          '<div class="abs" style="left:9mm;top:9mm;right:9mm;bottom:9mm;border:.55mm solid ' + frame + '"></div>' +
          '<div class="abs" style="left:12.2mm;top:12.2mm;right:12.2mm;bottom:12.2mm;border:.2mm solid ' + (dark ? rgba(C.line,.5) : C.gold) + '"></div>' +
          '<div class="abs" style="left:0;right:0;top:20mm">' + logo(A, dark ? "white" : "gold", 44, "margin:0 auto") + "</div>" +
          '<div class="abs ctr" style="left:20mm;right:20mm;top:47mm"><div class="serif" style="font-size:' + (award ? 34 : 32) + 'pt;line-height:1.1;letter-spacing:.02em;color:' + fg + '">' + T(f.title) + "</div>" +
            (f.forLine ? '<div class="caps" style="font-size:8.5pt;margin-top:2.6mm;color:' + acc + '">' + T(f.forLine) + "</div>" : "") + "</div>" +
          '<div class="abs ctr" style="left:20mm;right:20mm;top:' + (f.forLine ? 78 : 71) + 'mm"><div class="caps" style="font-size:8.5pt;letter-spacing:.3em;color:' + acc + '">' + T(f.pre) + "</div>" +
            '<div class="serif" style="font-size:42pt;line-height:1.15;margin-top:4mm;color:' + (dark ? C.cream : C.gold) + '">' + (f.name && String(f.name).trim() ? T(f.name) : '<span class="fld blank" style="width:150mm;height:14mm"></span>') + "</div>" +
            (f.name && String(f.name).trim() ? '<div style="width:90mm;height:.3mm;background:' + mau + ';margin:1.6mm auto 3mm"></div>' : '<div style="height:4mm"></div>') +
            '<div style="font-size:12pt;color:' + acc + '">' + (f.role && String(f.role).trim() ? T(f.role) + ", " + T(venueLine(f)) : '<span class="fld blank" style="width:110mm;height:7mm"></span>') + "</div>" +
            '<div style="font-size:13pt;line-height:1.55;max-width:180mm;margin:5.5mm auto 0;color:' + fg + '">' + T(f.cite) + "</div></div>" +
          '<div class="abs" style="left:34mm;bottom:23mm">' + sig(f.s1n, f.s1t) + "</div>" +
          '<div class="abs" style="left:50%;margin-left:-16mm;bottom:19mm">' + seal(A, 32, f.sealTop, f.sealBottom, dark ? "dark" : "light") + "</div>" +
          '<div class="abs" style="right:34mm;bottom:23mm;display:flex;gap:10mm">' + sig(f.s2n, f.s2t).replace("width:62mm", "width:50mm") + '<div style="width:34mm;text-align:center"><div style="height:11mm;display:flex;align-items:flex-end;justify-content:center;font-size:10pt;font-weight:600;padding-bottom:1mm">' + (f.date && String(f.date).trim() ? T(f.date) : "") + '</div><div style="border-top:.3mm solid ' + acc + ';padding-top:1.6mm;font-size:8pt;color:' + acc + '">Date</div></div></div>';
      } }]
    };
  }
  P.certExcellence = certPiece("excellence");
  P.certAward = certPiece("award");

  /* 5a. DIGITAL BUSINESS CARD  1080 x 1920 px (phone) */
  var DW = 1080, DH = 1920;
  P.bizDigital = {
    item: "business-card", name: "Digital business card (phone)", w: DW * PX, h: DH * PX, print: false, px: [DW, DH],
    fields: [
      { k: "name", l: "Full name", d: "[Full name]" }, { k: "title", l: "Job title", d: "[Job title]" },
      { k: "mobile", l: "Mobile or WhatsApp", d: "[mobile number]" },
      { k: "mail", l: "Email", d: "[name]@" + WEBSITE, hint: "Use the person's own address." },
      { k: "line", l: "Short line (optional)", d: TAGLINE },
      qrField("https://" + WEBSITE, "QR code link"), qrLabelField("Scan to visit us"),
      photoField("sage")
    ],
    sides: [{ name: "card", bg: C.cream, html: function (f, A) {
      var row = function (lab, v) { return v && String(v).trim() ? '<div style="padding:' + px(26) + ' 0;border-bottom:' + px(2) + ' solid ' + C.line + '"><div class="caps" style="font-size:' + px(21) + ';letter-spacing:.24em;color:' + C.gold + '">' + lab + '</div><div style="font-size:' + px(40) + ';margin-top:' + px(8) + ';word-break:break-word">' + T(v) + "</div></div>" : ""; };
      return '<div class="photo" style="left:0;top:0;width:' + px(1080) + ';height:' + px(640) + ';' + photoStyle(A, f.photo, "50% 55%") + '"></div>' +
        '<div class="abs" style="left:0;top:0;width:' + px(1080) + ';height:' + px(640) + ';background:linear-gradient(180deg,rgba(20,22,26,.5),rgba(20,22,26,0) 55%)"></div>' +
        '<div class="abs" style="left:0;top:' + px(130) + ';width:' + px(1080) + '">' + logo(A, "white", 330 * PX, "margin:0 auto") + "</div>" +
        '<div class="abs ctr" style="left:' + px(110) + ';right:' + px(110) + ';top:' + px(690) + '"><div class="serif" style="font-size:' + px(92) + ';line-height:1.05">' + T(f.name) + '</div><div class="caps" style="font-size:' + px(24) + ';margin-top:' + px(20) + ';color:' + C.gold + '">' + T(f.title) + '</div><div style="font-size:' + px(26) + ';margin-top:' + px(12) + ';color:' + C.ink + '">' + T(venueLine(f)) + "</div>" +
          '<div style="width:' + px(90) + ';height:' + px(3) + ';background:' + C.mauve + ';margin:' + px(36) + ' auto 0"></div></div>' +
        '<div class="abs" style="left:' + px(110) + ';right:' + px(110) + ';top:' + px(1030) + '">' + row("Mobile / WhatsApp", f.mobile) + row("Email", f.mail) + row("Website", WEBSITE) + "</div>" +
        '<div class="abs" style="left:' + px(110) + ';top:' + px(1495) + ';width:' + px(280) + '">' + qrCode(f.qr, 280 * PX, "[QR code: paste link]", "11pt") + "</div>" +
        '<div class="abs" style="left:' + px(430) + ';top:' + px(1535) + ';width:' + px(540) + '"><div class="serif" style="font-size:' + px(44) + ';line-height:1.15">' + T(f.qrLabel) + '</div><div style="font-size:' + px(24) + ';line-height:1.45;margin-top:' + px(10) + ';color:' + C.gold + '">' + T(f.line) + "</div></div>" +
        '<div class="strip" style="left:0;right:0;bottom:0;height:' + px(130) + ';background-color:' + C.band + ';' + patternCss(C.line, px(66) + " " + px(33)) + '"></div>';
    } }]
  };

  /* 5b. PRINT BUSINESS CARD  90 x 55 (front + back) */
  P.bizPrint = {
    item: "business-card", name: "Business card (print 90 x 55)", w: 90, h: 55, print: true,
    fields: P.bizDigital.fields.filter(function (x) { return x.k !== "photo" && x.k !== "line"; }).map(function (x) { return x.k === "qr" ? qrField("https://" + WEBSITE, "QR code link (back of the card)") : x.k === "qrLabel" ? qrLabelField("Scan to visit us") : x; }),
    sides: [
      { name: "front", bg: C.ink, html: function (f, A) {
        return '<div class="abs" style="left:0;right:0;top:15.5mm">' + logo(A, "white", 36, "margin:0 auto") + "</div>" +
          '<div class="abs" style="left:36mm;width:18mm;top:35.5mm;height:.3mm;background:' + C.mauve + '"></div>' +
          '<div class="abs caps ctr" style="left:0;right:0;top:38mm;font-size:5.2pt;letter-spacing:.42em;color:' + C.cream + '">' + esc(PLACE) + "</div>";
      } },
      { name: "back", bg: C.cream, html: function (f, A) {
        var r = function (lab, v) { return v && String(v).trim() ? '<div style="display:flex;gap:1.6mm;margin-bottom:1.5mm"><span class="caps" style="font-size:4.2pt;letter-spacing:.12em;color:' + C.gold + ';width:9mm;padding-top:.5mm;flex:none">' + lab + '</span><span style="font-size:6.6pt;word-break:break-word">' + T(v) + "</span></div>" : ""; };
        return '<div class="abs" style="left:7mm;top:7mm"><div class="serif" style="font-size:15pt;line-height:1.05">' + T(f.name) + '</div><div class="caps" style="font-size:5.2pt;margin-top:1.4mm;color:' + C.gold + '">' + T(f.title) + '</div><div style="font-size:6.2pt;margin-top:.8mm">' + T(venueLine(f)) + "</div></div>" +
          '<div class="abs" style="left:7mm;top:25mm;width:51mm">' + r("Mobile", f.mobile) + r("Email", f.mail) + r("Web", WEBSITE) + "</div>" +
          '<div class="abs ctr" style="left:61mm;width:22mm;top:17.5mm;display:flex;flex-direction:column;align-items:center">' + qrCode(f.qr, 22, "[QR code: paste link]", "5pt") +
            '<div style="font-size:4.4pt;line-height:1.2;color:' + C.gold + '">' + T(f.qrLabel) + "</div></div>" +
          '<div class="abs" style="right:7mm;top:7mm">' + logo(A, "symbol", 10) + "</div>" +
          '<div class="strip" style="bottom:-3mm;height:7mm;background-color:' + C.band + ";" + patternCss(C.line, "5mm 2.5mm") + '"></div>';
      } }
    ]
  };

  /* ---------- assembling one side ---------- */
  // opts: { bleed: bool, marks: bool }  -> returns the HTML of one 'sheet'
  function defaults(piece, shared) {
    var f = {}; SHARED.forEach(function (s) { f[s.k] = s.d; });
    piece.fields.forEach(function (x) { f[x.k] = x.d; });
    if (shared) Object.keys(shared).forEach(function (k) { f[k] = shared[k]; });
    return f;
  }
  function markSvg(W, H, w, h, m) {
    // crop marks: 5 mm long, starting 3 mm outside the trim edge
    var s = '<svg class="abs" style="left:0;top:0" width="' + mm(W) + '" height="' + mm(H) + '" viewBox="0 0 ' + W + " " + H + '"><g stroke="#000" stroke-width=".1" fill="none">', o = BLEED, L = 5;
    [[m, m, -1, -1], [m + w, m, 1, -1], [m, m + h, -1, 1], [m + w, m + h, 1, 1]].forEach(function (c) {
      s += '<path d="M' + (c[0] + c[2] * o) + " " + c[1] + " h" + (c[2] * L) + " M" + c[0] + " " + (c[1] + c[3] * o) + " v" + (c[3] * L) + '"/>';
    });
    return s + "</g></svg>";
  }
  function sideHTML(piece, sideIdx, f, A, opts) {
    opts = opts || {}; var side = piece.sides[sideIdx];
    var b = opts.bleed ? BLEED : 0, m = opts.marks ? MARGIN : (opts.bleed ? BLEED : 0);
    var W = piece.w + 2 * m, H = piece.h + 2 * m;
    var bg = side.bgFn ? side.bgFn(f) : side.bg;
    return '<div class="sheet' + (f.style === "dark" ? " dark" : "") + '" style="width:' + mm(W) + ";height:" + mm(H) + '">' +
      '<div class="bleedbox" style="left:' + mm(m - b) + ";top:" + mm(m - b) + ";width:" + mm(piece.w + 2 * b) + ";height:" + mm(piece.h + 2 * b) + ";background:" + bg + '">' +
      '<div class="trim" style="left:' + mm(b) + ";top:" + mm(b) + ";width:" + mm(piece.w) + ";height:" + mm(piece.h) + '">' + side.html(f, A) + "</div></div>" +
      (opts.marks ? markSvg(W, H, piece.w, piece.h, m) : "") + "</div>";
  }
  function sheetSize(piece, opts) { var m = opts.marks ? MARGIN : (opts.bleed ? BLEED : 0); return { w: piece.w + 2 * m, h: piece.h + 2 * m }; }
  function docHTML(piece, f, A, opts) {
    var s = sheetSize(piece, opts), pages = piece.sides.map(function (_, i) { return sideHTML(piece, i, f, A, opts); }).join("");
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" + esc(piece.name) + "</title><style>@page{size:" + mm(s.w) + " " + mm(s.h) + ";margin:0}html,body{margin:0}" + css(A) +
      ".sheet{break-after:page;page-break-after:always}.sheet:last-child{break-after:auto;page-break-after:auto}</style></head><body>" + pages + "</body></html>";
  }

  var HANDWRITE = { giftcard: ["value", "cardNo", "valid"], voucher: ["recipient", "service", "from", "voucherNo", "valid", "issued", "issuedBy"],
    certExcellence: ["name", "role", "date", "s1n", "s2n"], certAward: ["name", "role", "date", "forLine", "s1n", "s2n"] };
  // Fields that mean the same thing on different formats/tabs. The maker stores ONE value for each group.
  var SYNC = {
    // business card: phone <-> print
    "biz.name": ["bizDigital.name", "bizPrint.name"], "biz.title": ["bizDigital.title", "bizPrint.title"],
    "biz.mobile": ["bizDigital.mobile", "bizPrint.mobile"], "biz.mail": ["bizDigital.mail", "bizPrint.mail"],
    "biz.qr": ["bizDigital.qr", "bizPrint.qr"], "biz.qrLabel": ["bizDigital.qrLabel", "bizPrint.qrLabel"],
    // certificates: Excellence <-> Award (the person being recognised, the date, the signatories)
    "cert.name": ["certExcellence.name", "certAward.name"], "cert.title": ["certExcellence.role", "certAward.role"],
    "cert.date": ["certExcellence.date", "certAward.date"],
    "cert.1n": ["certExcellence.s1n", "certAward.s1n"], "cert.1t": ["certExcellence.s1t", "certAward.s1t"],
    "cert.2n": ["certExcellence.s2n", "certAward.s2n"], "cert.2t": ["certExcellence.s2t", "certAward.s2t"],
    // gift card <-> gift voucher
    "gift.qr": ["giftcard.qr", "voucher.qr"], "gift.qrLabel": ["giftcard.qrLabel", "voucher.qrLabel"],
    "gift.valid": ["giftcard.valid", "voucher.valid"], "gift.for": ["giftcard.value", "voucher.service"]
  };
  root.CM = { brandAssets: brandAssets, BRAND: BRAND, FONT_HEAD: FONT_HEAD, FONT_BODY: FONT_BODY, HANDWRITE: HANDWRITE, SYNC: SYNC, WEBSITE: WEBSITE, C: C, P: P, SHARED: SHARED, PHOTOS: PHOTOS, BLEED: BLEED, MARGIN: MARGIN, css: css, defaults: defaults, sideHTML: sideHTML, docHTML: docHTML, sheetSize: sheetSize, esc: esc, qrData: qrData, qrInfo: qrInfo, qrSvg: qrSvg };
  if (typeof module !== "undefined") module.exports = root.CM;
})(typeof window !== "undefined" ? window : globalThis);
