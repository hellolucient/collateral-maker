/* Collateral Maker - fills in the designs from pieces.js. Everything runs in the browser; nothing is uploaded. Brand settings: config.js. */
(function () {
  "use strict";
  var M = window.CM, P = M.P, CFG = window.CONFIG || {};
  var A = M.brandAssets(); A.fontCSS = (window.MAKER_ASSETS || {}).fontCSS || "";
  var PREFIX = CFG.storagePrefix || "collateral-maker", BRAND = CFG.brandName || "Your Brand";
  // colours and fonts for the page itself
  (function () {
    var c = CFG.colors || {}, f = CFG.fonts || {}, r = document.documentElement.style;
    if (c.ink) r.setProperty("--ink", c.ink); if (c.accent) r.setProperty("--gold", c.accent); if (c.paper) r.setProperty("--cream", c.paper);
    if (c.band) r.setProperty("--band", c.band); if (c.highlight) r.setProperty("--mauve", c.highlight); if (c.line) r.setProperty("--line", c.line);
    if (f.heading) r.setProperty("--font-head", f.heading); if (f.body) r.setProperty("--font-body", f.body);
    document.title = BRAND + " " + (CFG.appTitle || "Collateral Maker");
    var tb = document.getElementById("brandbar");
    if (tb) tb.innerHTML = "<img src=\"" + A.logoGold + "\" alt=\"" + M.esc(BRAND) + "\"><span class=\"tool\">" + M.esc(CFG.appTitle || "Collateral Maker") + "</span>";
  })();
  var TABS = [
    { id: "review", label: "Review card", pieces: ["review"], lead: "An A6 card (105 × 148 mm) that invites customers to leave a review. Front and back." },
    { id: "postcard", label: "Welcome postcard", pieces: ["postcard"], lead: "Photo on the front, your message and signature on the back (150 × 100 mm)." },
    { id: "gift", label: "Gift card & voucher", pieces: ["giftcard", "voucher"], labels: ["Gift card (85.6 × 54 mm)", "Gift voucher (210 × 99 mm)"], lead: "A matching pair. What you type is kept when you switch between them." },
    { id: "cert", label: "Certificates", pieces: ["certExcellence", "certAward"], labels: ["Certificate of Excellence", "Award certificate"], lead: "A4 landscape. Names, job title, date and signatories are kept when you switch." },
    { id: "biz", label: "Business card", pieces: ["bizDigital", "bizPrint"], labels: ["Phone card (1080 × 1920)", "Print card (90 × 55 mm)"], lead: "A card to share on a phone, and a printed one. Your details are kept when you switch." },
    { id: "request", label: "Request new", request: true },
    { id: "log", label: "Log", log: true }
  ];
  var NP = CFG.numberPrefixes || {};
  var NUMS = { voucher: { k: "voucherNo", prefix: NP.voucher || "GV-" }, giftcard: { k: "cardNo", prefix: NP.giftcard || "GC-" } };
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return M.esc(s); }

  /* ---------- storage ---------- */
  var KEY = PREFIX + "-v1", LOGKEY = PREFIX + "-log-v1", IMGKEY = PREFIX + "-image-v1";
  var store = { data: {}, tab: 0, variant: {}, side: 0 }, log = [];
  try { var sv = JSON.parse(localStorage.getItem(KEY) || "null"); if (sv && sv.data) store = Object.assign(store, sv); } catch (e) {}
  try { log = JSON.parse(localStorage.getItem(LOGKEY) || "[]") || []; } catch (e) { log = []; }
  function saveStore() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
  /* ---------- your own photo (kept on this device only) ---------- */
  function setCustomPhoto(url) {
    var has = M.PHOTOS.some(function (o) { return o[0] === "custom"; });
    if (url) { A.photos.custom = "url('" + url + "')"; if (!has) M.PHOTOS.push(["custom", "Your own photo"]); }
    else { delete A.photos.custom; M.PHOTOS.forEach(function (o, i) { if (o[0] === "custom") M.PHOTOS.splice(i, 1); }); }
  }
  try { var ci = localStorage.getItem(IMGKEY); if (ci) setCustomPhoto(ci); } catch (e) {}
  function loadPhotoFile(file, done) {
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        done(c.toDataURL("image/jpeg", 0.85));
      };
      im.onerror = function () { done(null); }; im.src = rd.result;
    };
    rd.onerror = function () { done(null); }; rd.readAsDataURL(file);
  }
  function saveLog() { try { localStorage.setItem(LOGKEY, JSON.stringify(log)); } catch (e) {} }

  /* ---------- dates ---------- */
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function today() { return iso(new Date()); }
  function plusMonths(n) { var d = new Date(); var day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return iso(d); }
  function nice(isoStr) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoStr || ""); return m ? (+m[3]) + " " + MONTHS[+m[2] - 1] + " " + m[1] : ""; }

  /* ---------- the shared data model ---------- */
  var canonOf = {};
  Object.keys(M.SYNC).forEach(function (c) { M.SYNC[c].forEach(function (pk) { canonOf[pk] = c; }); });
  var sharedKeys = {}; M.SHARED.forEach(function (s) { sharedKeys[s.k] = 1; });
  function canon(pk, k) { return sharedKeys[k] ? "shared." + k : (canonOf[pk + "." + k] || pk + "." + k); }
  function nextNumber(pk) {
    var n = NUMS[pk], max = 0, re = new RegExp("^" + n.prefix + "(\\d+)$");
    log.forEach(function (e) { if (e.pk === pk && e.number) { var m = re.exec(e.number); if (m) max = Math.max(max, +m[1]); } });
    return n.prefix + ("0000" + (max + 1)).slice(-4);
  }
  function defaultFor(pk, x) {
    if (x.t === "date") return x.k === "valid" ? plusMonths(12) : today();
    if (NUMS[pk] && NUMS[pk].k === x.k) return nextNumber(pk);
    return x.d;
  }
  function allFields(pk) { return M.SHARED.concat(P[pk].fields); }
  function getRaw(pk, x) { var c = canon(pk, x.k); return Object.prototype.hasOwnProperty.call(store.data, c) ? store.data[c] : defaultFor(pk, x); }
  function setRaw(pk, k, v) { store.data[canon(pk, k)] = v; saveStore(); }
  function rawVals(pk) { var o = {}; allFields(pk).forEach(function (x) { o[x.k] = getRaw(pk, x); }); return o; }
  function fmtVals(pk) { var o = rawVals(pk); P[pk].fields.forEach(function (x) { if (x.t === "date") o[x.k] = nice(o[x.k]); }); return o; }
  function persistDefaults(pk) { allFields(pk).forEach(function (x) { var c = canon(pk, x.k); if (!Object.prototype.hasOwnProperty.call(store.data, c)) store.data[c] = defaultFor(pk, x); }); saveStore(); }

  var tab = function () { return TABS[store.tab] || TABS[0]; };
  function pieceKey() { var t = tab(); return t.pieces[store.variant[t.id] || 0]; }
  function piece() { return P[pieceKey()]; }
  var $app = $("#app"), frame, scaler, status;

  /* ---------- screens ---------- */
  function fieldHTML(x, pk) {
    var v = getRaw(pk, x), id = "f_" + x.k, h = "<label for=\"" + id + "\">" + esc(x.l) + "</label>";
    if (x.t === "check") return "<label class=\"checkrow\"><input type=\"checkbox\" id=\"" + id + "\" data-k=\"" + x.k + "\"" + (v ? " checked" : "") + "> " + esc(x.l) + "</label>";
    if (x.t === "select") return h + "<select id=\"" + id + "\" data-k=\"" + x.k + "\">" + x.o.map(function (o) { return "<option value=\"" + esc(o[0]) + "\"" + (v === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>" +
      (x.k === "photo" ? "<label for=\"photoFile\" class=\"sublabel\">Or use your own photo</label><input type=\"file\" id=\"photoFile\" accept=\"image/*\"><p class=\"hint\">The photo stays on this device. It is shrunk to fit." + (A.photos.custom ? " <button class=\"link\" data-rmphoto=\"1\">Remove my photo</button>" : "") + "</p><p class=\"hint\" id=\"photoMsg\"></p>" : "");
    if (x.t === "textarea") return h + "<textarea id=\"" + id + "\" data-k=\"" + x.k + "\" rows=\"4\">" + esc(v) + "</textarea>" + (x.hint ? "<p class=\"hint\">" + esc(x.hint) + "</p>" : "");
    if (x.t === "date") return h + "<input type=\"date\" id=\"" + id + "\" data-k=\"" + x.k + "\" value=\"" + esc(v) + "\"><p class=\"hint\"><span id=\"nice_" + x.k + "\">" + (v ? "Shows as " + esc(nice(v)) : "Left blank, to write by hand") + "</span> · <button class=\"link\" data-blankdate=\"" + x.k + "\">Leave blank</button> <button class=\"link\" data-today=\"" + x.k + "\">" + (x.k === "valid" ? "In 12 months" : "Today") + "</button></p>";
    var extra = (x.hint ? "<p class=\"hint\">" + esc(x.hint) + "</p>" : "");
    if (x.t === "url") return h + "<input id=\"" + id + "\" data-k=\"" + x.k + "\" type=\"text\" inputmode=\"url\" autocapitalize=\"off\" autocorrect=\"off\" spellcheck=\"false\" value=\"" + esc(v) + "\" autocomplete=\"off\" placeholder=\"https://\">" + extra + "<p class=\"hint qrinfo\" id=\"qrinfo\"></p>";
    if (NUMS[pk] && NUMS[pk].k === x.k) extra = "<p class=\"hint\" id=\"numhint\"></p>";
    return h + "<input id=\"" + id + "\" data-k=\"" + x.k + "\" value=\"" + esc(v) + "\" autocomplete=\"off\">" + extra;
  }
  function drawNav() {
    $("#nav").innerHTML = TABS.map(function (t, i) { return "<button class=\"nav\" data-tab=\"" + i + "\"" + (i === store.tab ? " aria-current=\"page\"" : "") + ">" + esc(t.label) + (t.log && log.length ? " (" + log.length + ")" : "") + "</button>"; }).join("");
  }
  function drawShell() {
    if (tab().log) return drawLog();
    if (tab().request) return drawRequest();
    var t = tab(), pk = pieceKey();
    $app.innerHTML =
      "<div class=\"make\"><section class=\"form\"><p class=\"lead\">" + esc(t.lead) + "</p>" +
      (t.pieces.length > 1 ? "<fieldset><legend>Which one?</legend><div class=\"chips\">" + t.pieces.map(function (k, i) { return "<button class=\"chip\" data-var=\"" + i + "\" aria-pressed=\"" + ((store.variant[t.id] || 0) === i) + "\">" + esc(t.labels[i]) + "</button>"; }).join("") + "</div></fieldset>" : "") +
      "<details class=\"shared\" id=\"shared\"><summary>Your business (used on every card)</summary>" + M.SHARED.map(function (x) { return fieldHTML(x, pk); }).join("") + "<p class=\"hint\">The website is always " + esc(M.WEBSITE) + ".</p></details>" +
      "<fieldset><legend>The words</legend><div id=\"fields\"></div>" +
      (M.HANDWRITE[pk] ? "<p><button class=\"link\" id=\"hand\">Leave the fill-in fields empty, to write them by hand</button></p>" : "") +
      "<p><button class=\"link\" id=\"reset\">Put this card's words back to how they started</button></p></fieldset></section>" +
      "<section class=\"side\"><div class=\"chips\" id=\"sides\"></div><div class=\"stage\" id=\"stage\"><div class=\"scaler\" id=\"scaler\"><iframe id=\"frame\" title=\"Preview\"></iframe></div></div>" +
      "<p class=\"size\" id=\"size\"></p><div class=\"warnings\" id=\"warn\"></div><div class=\"dl\" id=\"dl\"></div><p class=\"status\" id=\"status\" role=\"status\"></p>" +
      "<p class=\"endnote\">Anything in [square brackets] is a placeholder. Fill it in before you print. Your details are saved on this device only.</p></section></div>";
    frame = $("#frame"); scaler = $("#scaler"); status = $("#status");
    var doc = frame.contentDocument; doc.open(); doc.write("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>html,body{margin:0;overflow:hidden}" + M.css(A) + "</style></head><body></body></html>"); doc.close();
    drawFields(); drawSides(); drawDl(); update();
  }
  function drawFields() { var pk = pieceKey(); $("#fields").innerHTML = piece().fields.map(function (x) { return fieldHTML(x, pk); }).join(""); }
  function drawSides() {
    var p = piece(); if (store.side >= p.sides.length) store.side = 0;
    $("#sides").innerHTML = p.sides.length > 1 ? p.sides.map(function (s, i) { return "<button class=\"chip ghost\" data-side=\"" + i + "\" aria-pressed=\"" + (store.side === i) + "\">" + esc(s.name.charAt(0).toUpperCase() + s.name.slice(1)) + "</button>"; }).join("") : "";
  }
  function drawDl() {
    var p = piece(), h = "";
    if (p.print) {
      h += "<button class=\"btn\" data-go=\"print\">Download print-ready PDF</button><button class=\"btn sec\" data-go=\"screen\">Download PDF to view</button>";
      h += p.sides.map(function (s, i) { return "<button class=\"btn sec\" data-go=\"png\" data-s=\"" + i + "\">Download " + (p.sides.length > 1 ? s.name + " " : "") + "picture (PNG)</button>"; }).join("");
      h += "<button class=\"link\" data-go=\"browserprint\">Or print from this browser (sharpest lines)</button>";
    } else {
      h += "<button class=\"btn\" data-go=\"png\" data-s=\"0\">Download picture (PNG)</button><button class=\"btn sec\" data-go=\"screen\">Download PDF</button><button class=\"btn sec\" data-go=\"vcf\">Download contact file (.vcf)</button>";
    }
    $("#dl").innerHTML = h;
    $("#size").textContent = p.print ? "Trim size " + p.w + " × " + p.h + " mm. The print PDF adds 3 mm bleed and crop marks." : "Screen size " + p.px[0] + " × " + p.px[1] + " px.";
  }
  var timer;
  function update() { clearTimeout(timer); timer = setTimeout(paint, 60); }
  function dupInfo(pk, f) {
    var n = NUMS[pk]; if (!n) return null; var val = String(f[n.k] || "").trim(); if (!val) return null;
    var sig = pk === "voucher" ? [f.recipient, f.service, f.valid].join("|") : [f.value, f.valid].join("|");
    var hit = log.filter(function (e) { return e.pk === pk && e.number === val && e.sig !== sig; })[0];
    return hit || null;
  }
  function paint() {
    if (!frame || tab().log || tab().request) return;
    var p = piece(), pk = pieceKey(), f = fmtVals(pk), doc = frame.contentDocument; if (!doc || !doc.body) return;
    doc.body.innerHTML = "<div class=\"rootwrap\">" + M.sideHTML(p, store.side, f, A, {}) + "</div>";
    var w = p.w * 96 / 25.4, h = p.h * 96 / 25.4;
    var stage = $("#stage"), avail = stage.clientWidth - 28, maxH = Math.max(320, window.innerHeight - 330);
    var k = Math.min(avail / w, maxH / h, 2.2); if (!(k > 0)) k = 1;
    frame.style.width = w + "px"; frame.style.height = h + "px"; frame.style.transform = "scale(" + k + ")";
    scaler.style.width = w * k + "px"; scaler.style.height = h * k + "px";
    var open = [];
    p.fields.forEach(function (x) { if (x.t !== "check" && x.t !== "select" && x.t !== "date" && /\[[^\]]+\]/.test(String(f[x.k] || ""))) open.push(x.l); });
    M.SHARED.forEach(function (x) { if (/\[[^\]]+\]/.test(String(f[x.k] || ""))) open.push(x.l); });
    var uniq = open.filter(function (a, i) { return open.indexOf(a) === i; }), html = "";
    var dup = dupInfo(pk, f);
    if (dup) html += "<p class=\"warn\"><b>Number already used:</b> " + esc(dup.number) + " was logged on " + esc(niceTs(dup.ts)) + " for " + esc(dup.name || dup.details || "another card") + ". Pick a different number.</p>";
    html += uniq.length ? "<p class=\"warn\"><b>" + uniq.length + " placeholder" + (uniq.length > 1 ? "s" : "") + " still in [brackets]:</b> " + esc(uniq.join(", ")) + ".</p>" : "<p class=\"note\">No [bracket] placeholders left.</p>";
    $("#warn").innerHTML = html;
    var qi = $("#qrinfo");
    if (qi) {
      var info = M.qrInfo(f.qr);
      if (!info) qi.innerHTML = "No link yet, so the card shows a dashed box. Paste a link to make the code.";
      else qi.innerHTML = "The code opens <b class=\"qrurl\">" + esc(info.data.length > 70 ? info.data.slice(0, 67) + "..." : info.data) + "</b>" + (info.modules > 41 ? "<br><span class=\"qrwarn\">This is a long link, so the code is dense. Print it at 25 mm or larger, or use a shorter link, and test-scan it.</span>" : "");
    }
    var nh = $("#numhint"); if (nh) { var nx = nextNumber(pk); nh.innerHTML = "Next free number: <b>" + esc(nx) + "</b> <button class=\"link\" data-usenext=\"1\">Use it</button>. Clear the box to write it by hand."; }
    var d = piece().fields.filter(function (x) { return x.t === "date"; }); d.forEach(function (x) { var el = $("#nice_" + x.k); if (el) el.textContent = f[x.k] ? "Shows as " + f[x.k] : "Left blank, to write by hand"; });
  }

  /* ---------- exports ---------- */
  function cssPx(mm) { return mm * 96 / 25.4; }
  function renderCanvas(p, sideIdx, f, opts, dpi) {
    return new Promise(function (resolve, reject) {
      var s = p.print ? M.sheetSize(p, opts) : { w: p.w, h: p.h };
      var cw = p.print ? cssPx(s.w) : p.px[0], ch = p.print ? cssPx(s.h) : p.px[1];
      var pw = p.print ? Math.round(s.w / 25.4 * dpi) : p.px[0], ph = p.print ? Math.round(s.h / 25.4 * dpi) : p.px[1];
      var d = document.implementation.createHTMLDocument("");
      d.body.innerHTML = "<div class=\"rootwrap\"><style></style>" + M.sideHTML(p, sideIdx, f, A, opts) + "</div>";
      d.querySelector("style").textContent = M.css(A);
      var xhtml = new XMLSerializer().serializeToString(d.body.firstChild);
      var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + pw + "\" height=\"" + ph + "\" viewBox=\"0 0 " + cw + " " + ch + "\"><foreignObject x=\"0\" y=\"0\" width=\"" + cw + "\" height=\"" + ch + "\">" + xhtml + "</foreignObject></svg>";
      var img = new Image();
      img.onload = function () {
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(function () {
          try { var c = document.createElement("canvas"); c.width = pw; c.height = ph; var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, pw, ph); x.drawImage(img, 0, 0, pw, ph); c.toDataURL("image/png"); resolve({ canvas: c, w: s.w * 72 / 25.4, h: s.h * 72 / 25.4 }); }
          catch (e) { reject(e); }
        }, 250); });
      };
      img.onerror = function () { reject(new Error("render")); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }
  function canvasBlob(c, type) { return new Promise(function (res, rej) { try { c.toBlob(function (b) { b ? res(b) : rej(new Error("blob")); }, type); } catch (e) { rej(e); } }); }
  function save(blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function describe(pk, f) {
    var name = "", number = "", details = "", valid = f.valid || "";
    if (pk === "voucher") { name = f.recipient; number = f.voucherNo; details = "Redeemable for " + (f.service || "") + (f.from ? "; from " + f.from : ""); }
    else if (pk === "giftcard") { name = ""; number = f.cardNo; details = f.value || ""; }
    else if (pk === "certExcellence" || pk === "certAward") { name = f.name; details = f.title + (f.role ? ", " + f.role : ""); }
    else if (pk === "bizDigital" || pk === "bizPrint") { name = f.name; details = f.title || ""; }
    else if (pk === "postcard") { name = f.signName; details = "Signed by " + (f.signName || "") + (f.signTitle ? ", " + f.signTitle : ""); }
    else details = "Review card" + (f.place ? ", " + f.place : "");
    return { name: String(name || "").trim(), number: String(number || "").trim(), details: String(details || "").replace(/\s+/g, " ").trim(), valid: valid };
  }
  function fileBase(pk, f) {
    var p = P[pk], who = describe(pk, f).name; who = /\[/.test(who) ? "" : slug(who);
    return (slug(BRAND) || "collateral") + "-" + slug(p.name) + (who ? "-" + who : "");
  }
  function say(t, cls) { if (status) { status.textContent = t; status.className = "status " + (cls || "info"); } }
  function busy(on) { Array.prototype.forEach.call(document.querySelectorAll("#dl .btn"), function (b) { b.disabled = on; }); }
  function fail(e) { console.error(e); busy(false); say("This browser could not make the file. Try Chrome or Edge, or use \"print from this browser\".", "warn"); }
  function addLog(pk, format, file) {
    var f = fmtVals(pk), d = describe(pk, f), raw = rawVals(pk);
    var sig = pk === "voucher" ? [f.recipient, f.service, f.valid].join("|") : [f.value, f.valid].join("|");
    log.unshift({ id: "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: new Date().toISOString(), pk: pk, tab: store.tab, variant: store.variant[tab().id] || 0,
      item: P[pk].name, format: format, file: file, name: d.name, number: d.number, details: d.details, valid: d.valid, qr: M.qrData(f.qr) || "", sig: sig, snap: raw });
    saveLog(); drawNav(); update();
  }
  function pdfFor(pk, mode) {
    var p = P[pk], f = fmtVals(pk), opts = mode === "print" ? { bleed: true, marks: true } : {}, dpi = mode === "print" ? 300 : 200;
    return Promise.all(p.sides.map(function (_, i) { return renderCanvas(p, i, f, opts, dpi); })).then(function (pages) {
      return new Blob([window.CM_PDF.makePdf(pages, p.name)], { type: "application/pdf" });
    });
  }
  function go(what, sideIdx) {
    var pk = pieceKey(), p = piece();
    if (what === "vcf") return vcf();
    var dup = dupInfo(pk, fmtVals(pk));
    if (dup && !window.confirm("The number " + dup.number + " was already used (" + (dup.name || dup.details) + "). Make the file anyway?")) return;
    persistDefaults(pk);
    var f = fmtVals(pk), base = fileBase(pk, f);
    if (what === "browserprint") { browserPrint(pk); addLog(pk, "Print from browser (PDF)", base + " (browser print)"); return; }
    busy(true); say("Making your file...");
    var job, fmt, file;
    if (what === "print") { fmt = "Print PDF (bleed + crop marks)"; file = base + "-print-bleed-crops.pdf"; job = pdfFor(pk, "print").then(function (b) { save(b, file); }); }
    else if (what === "screen") { fmt = "Screen PDF"; file = base + ".pdf"; job = pdfFor(pk, "screen").then(function (b) { save(b, file); }); }
    else {
      var si = +sideIdx || 0; fmt = "PNG" + (p.sides.length > 1 ? " (" + p.sides[si].name + ")" : ""); file = base + (p.sides.length > 1 ? "-" + p.sides[si].name : "") + ".png";
      job = renderCanvas(p, si, f, {}, 300).then(function (r) { return canvasBlob(r.canvas, "image/png"); }).then(function (b) { save(b, file); });
    }
    job.then(function () { busy(false); addLog(pk, fmt, file); say("Done. Check your Downloads. It is in the Log tab.", "ok"); }, fail);
  }
  function browserPrint(pk) {
    var p = P[pk], f = fmtVals(pk), o = { bleed: true, marks: true }, s = M.sheetSize(p, o), root = document.createElement("div");
    root.id = "printroot"; root.style.display = "none";
    var st = document.createElement("style"); st.textContent = "@page{size:" + s.w + "mm " + s.h + "mm;margin:0}@media print{html,body{margin:0}.sheet{break-after:page}.sheet:last-child{break-after:auto}}" + M.css(A);
    root.appendChild(st); root.insertAdjacentHTML("beforeend", "<div class=\"rootwrap\">" + p.sides.map(function (_, i) { return M.sideHTML(p, i, f, A, o); }).join("") + "</div>");
    document.body.appendChild(root);
    setTimeout(function () { window.print(); setTimeout(function () { root.remove(); }, 1500); }, 200);
  }
  function vcf() {
    var pk = pieceKey(), f = fmtVals(pk), bad = ["name", "mobile", "mail"].filter(function (k) { return /\[/.test(f[k] || ""); });
    if (bad.length && !window.confirm("Some details are still in [brackets] (" + bad.join(", ") + "). Save the contact anyway?")) return;
    var parts = String(f.name || "").trim().split(/\s+/), last = parts.length > 1 ? parts.pop() : "", first = parts.join(" ");
    var L = ["BEGIN:VCARD", "VERSION:3.0", "N:" + last + ";" + first + ";;;", "FN:" + f.name, "ORG:" + (f.brand || BRAND) + (f.place && !/\[/.test(f.place) ? ", " + f.place : ""), "TITLE:" + f.title];
    if (f.mobile) L.push("TEL;TYPE=CELL:" + f.mobile); if (f.mail) L.push("EMAIL:" + f.mail); L.push("URL:https://" + M.WEBSITE);
    L.push("END:VCARD"); var file = fileBase(pk, f) + ".vcf"; save(new Blob([L.join("\r\n") + "\r\n"], { type: "text/vcard" }), file); persistDefaults(pk); addLog(pk, "Contact file (.vcf)", file); say("Contact file saved. It is in the Log tab.", "ok");
  }

  /* ---------- request a new piece ---------- */
  var REQ_TO = CFG.requestEmail || "requests@example.com";
  var REQ = [
    { k: "who", l: "Your name", ph: "Your name" },
    { k: "reply", l: "Where should we reply? (email or phone, optional)", ph: "" },
    { k: "what", l: "What do you need?", ph: "e.g. A welcome sign for the front desk" },
    { k: "kind", l: "Printed, on a screen, or both?", t: "select", o: ["Printed", "On a screen or phone", "Both", "Not sure"] },
    { k: "size", l: "Size (if you know)", ph: "e.g. A4, A5, a banner, 1080 × 1920" },
    { k: "words", l: "The words to put on it", t: "textarea", ph: "Type or paste the wording. Anything you are not sure of, put in [square brackets]." },
    { k: "notes", l: "Anything else? Style, photos, who it is for", t: "textarea", ph: "" },
    { k: "by", l: "Needed by (optional)", t: "date" }
  ];
  function reqVal(k) { var v = store.data["req." + k]; return v == null ? (k === "kind" ? "Printed" : "") : v; }
  function reqText() {
    var L = ["New collateral request (from the " + BRAND + " " + (CFG.appTitle || "Collateral Maker") + ")", ""];
    REQ.forEach(function (x) { var v = reqVal(x.k); if (x.t === "date") v = nice(v); if (String(v).trim()) L.push(x.l.replace(/ \(.*\)$/, "").replace(/\?$/, "") + ": " + String(v).trim()); });
    return L.join("\n");
  }
  function drawRequest() {
    $app.innerHTML = "<div class=\"logview\"><h2>Request something new</h2><p class=\"lead\">Need a piece of collateral that is not here? Describe it and send it to whoever makes your collateral. The button opens your own email app with the request ready to send.</p><fieldset><legend>Your request</legend>" +
      REQ.map(function (x) {
        var id = "r_" + x.k, v = reqVal(x.k), h = "<label for=\"" + id + "\">" + esc(x.l) + "</label>";
        if (x.t === "select") return h + "<select id=\"" + id + "\" data-r=\"" + x.k + "\">" + x.o.map(function (o) { return "<option" + (o === v ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>";
        if (x.t === "textarea") return h + "<textarea id=\"" + id + "\" data-r=\"" + x.k + "\" rows=\"4\" placeholder=\"" + esc(x.ph) + "\">" + esc(v) + "</textarea>";
        if (x.t === "date") return h + "<input type=\"date\" id=\"" + id + "\" data-r=\"" + x.k + "\" value=\"" + esc(v) + "\">";
        return h + "<input id=\"" + id + "\" data-r=\"" + x.k + "\" value=\"" + esc(v) + "\" placeholder=\"" + esc(x.ph) + "\" autocomplete=\"off\">";
      }).join("") +
      "<div class=\"dl\"><button class=\"btn\" data-reqmail=\"1\">Email this request</button><button class=\"btn sec\" data-reqcopy=\"1\">Copy the request text</button><button class=\"link\" data-reqclear=\"1\">Clear the form</button></div>" +
      "<p class=\"status\" id=\"status\" role=\"status\"></p><p class=\"endnote\">\"Email this request\" opens your own email app with the message ready, addressed to " + esc(REQ_TO) + ". Nothing is sent until you press send there.</p></fieldset></div>";
    status = $("#status");
  }
  function reqMail() {
    if (!String(reqVal("what")).trim()) { say("Please say what you need first.", "warn"); return; }
    var url = "mailto:" + REQ_TO + "?subject=" + encodeURIComponent("Collateral request: " + String(reqVal("what")).trim().slice(0, 80)) + "&body=" + encodeURIComponent(reqText());
    window.location.href = url; say("Your email app should open with the request. Press send there.", "ok");
  }
  function reqCopy() {
    var t = reqText();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { say("Copied. Paste it into an email to " + REQ_TO + ".", "ok"); }, function () { say("Could not copy. Use \"Email this request\" instead.", "warn"); });
    else say("Could not copy on this browser. Use \"Email this request\" instead.", "warn");
  }

  /* ---------- log ---------- */
  function niceTs(t) { var d = new Date(t); return isNaN(d) ? "" : d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear() + ", " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function drawLog() {
    var h = "<div class=\"logview\"><h2>Log</h2><p class=\"lead\">Every PDF and picture made on this device. The log lives in this browser only, so each computer or phone has its own.</p>";
    if (!log.length) h += "<p class=\"note logempty\">Nothing yet. Make a card and download it, and it appears here.</p>";
    else {
      h += "<div class=\"logbar\"><button class=\"btn\" data-logcsv=\"1\">Export CSV</button><button class=\"btn sec\" data-logclear=\"1\">Clear the whole log</button></div><div class=\"loglist\">";
      h += log.map(function (e) {
        return "<div class=\"logrow\"><div class=\"lr-top\"><b>" + esc(e.item) + "</b> <span class=\"fmt\">" + esc(e.format) + "</span></div>" +
          "<div class=\"lr-main\">" + esc([e.name, e.number].filter(Boolean).join(" · ") || e.details) + "</div>" +
          "<div class=\"lr-sub\">" + (e.name || e.number ? esc(e.details) + (e.details ? " · " : "") : "") + (e.valid ? "Valid until " + esc(e.valid) + " · " : "") + (e.qr ? "QR: <span class=\"lr-qr\">" + esc(e.qr) + "</span> · " : "") + "Made " + esc(niceTs(e.ts)) + "</div>" +
          "<div class=\"lr-btns\"><button class=\"btn sec\" data-open=\"" + e.id + "\">Open again</button><button class=\"btn sec danger\" data-rm=\"" + e.id + "\">Remove</button></div></div>";
      }).join("") + "</div>";
    }
    $app.innerHTML = h + "</div>";
  }
  function csvCell(v) { v = String(v == null ? "" : v); return /[",\n\r]/.test(v) ? "\"" + v.replace(/"/g, "\"\"") + "\"" : v; }
  function exportCsv() {
    var rows = [["Date created", "Item", "Format", "Name / recipient", "Number", "Details", "Valid until", "QR code link", "File name"]];
    log.slice().reverse().forEach(function (e) { rows.push([niceTs(e.ts), e.item, e.format, e.name, e.number, e.details, e.valid, e.qr || "", e.file]); });
    var csv = "\ufeff" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n") + "\r\n";
    save(new Blob([csv], { type: "text/csv" }), "collateral-log-" + today() + ".csv");
  }
  function openAgain(id) {
    var e = log.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    Object.keys(e.snap).forEach(function (k) { store.data[canon(e.pk, k)] = e.snap[k]; });
    var ti = -1; TABS.forEach(function (t, i) { if (t.pieces && t.pieces.indexOf(e.pk) >= 0) { ti = i; store.variant[t.id] = t.pieces.indexOf(e.pk); } });
    if (ti >= 0) store.tab = ti; store.side = 0; saveStore(); drawNav(); drawShell(); window.scrollTo(0, 0); say("Opened again with the details from " + niceTs(e.ts) + ".", "ok");
  }

  /* ---------- events ---------- */
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.r) { store.data["req." + t.dataset.r] = t.value; saveStore(); return; }
    if (t.dataset && t.dataset.k) { var pk = pieceKey(); setRaw(pk, t.dataset.k, t.type === "checkbox" ? t.checked : t.value); update(); }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "photoFile" && t.files && t.files[0]) {
      var msg = $("#photoMsg"); if (msg) msg.textContent = "Reading the photo...";
      loadPhotoFile(t.files[0], function (url) {
        if (!url) { if (msg) msg.textContent = "That file could not be read as a picture."; return; }
        var kept = true; try { localStorage.setItem(IMGKEY, url); } catch (er) { kept = false; }
        setCustomPhoto(url); setRaw(pieceKey(), "photo", "custom"); drawFields(); update();
        var m2 = $("#photoMsg"); if (m2 && !kept) m2.textContent = "Used for now, but this browser has no room to remember it.";
      });
      return;
    }
     if (t.dataset && t.dataset.r) { store.data["req." + t.dataset.r] = t.value; saveStore(); return; } if (t.dataset && t.dataset.k && (t.tagName === "SELECT" || t.type === "date")) { setRaw(pieceKey(), t.dataset.k, t.value); update(); } });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var d = b.dataset;
    if (d.tab != null) { store.tab = +d.tab; store.side = 0; saveStore(); drawNav(); drawShell(); window.scrollTo(0, 0); }
    else if (d.var != null) { store.variant[tab().id] = +d.var; store.side = 0; saveStore(); drawShell(); }
    else if (d.side != null) { store.side = +d.side; saveStore(); drawSides(); update(); }
    else if (d.go) go(d.go, d.s);
    else if (d.rmphoto) { try { localStorage.removeItem(IMGKEY); } catch (er) {} setCustomPhoto(null); Object.keys(store.data).forEach(function (k) { if (store.data[k] === "custom" && /photo$/.test(k)) delete store.data[k]; }); saveStore(); drawFields(); update(); }
    else if (d.blankdate) { setRaw(pieceKey(), d.blankdate, ""); $("#f_" + d.blankdate).value = ""; update(); }
    else if (d.today) { var pk = pieceKey(), v = d.today === "valid" ? plusMonths(12) : today(); setRaw(pk, d.today, v); $("#f_" + d.today).value = v; update(); }
    else if (d.usenext) { var pk2 = pieceKey(), n = NUMS[pk2]; setRaw(pk2, n.k, nextNumber(pk2)); $("#f_" + n.k).value = nextNumber(pk2); update(); }
    else if (b.id === "hand") { var pk3 = pieceKey(); M.HANDWRITE[pk3].forEach(function (k) { setRaw(pk3, k, ""); }); drawFields(); update(); say("Those fields will print as blank lines.", "info"); }
    else if (b.id === "reset") { if (!window.confirm("Put this card's words back to the starting text? Shared details such as the name will reset on the other cards too.")) return; var pk4 = pieceKey(); allFields(pk4).forEach(function (x) { delete store.data[canon(pk4, x.k)]; }); saveStore(); drawShell(); }
    else if (d.reqmail) reqMail();
    else if (d.reqcopy) reqCopy();
    else if (d.reqclear) { Object.keys(store.data).forEach(function (k) { if (k.indexOf("req.") === 0) delete store.data[k]; }); saveStore(); drawRequest(); }
    else if (d.logcsv) exportCsv();
    else if (d.logclear) { if (window.confirm("Remove every entry from the log? The files you already downloaded are not affected.")) { log = []; saveLog(); drawNav(); drawLog(); } }
    else if (d.open) openAgain(d.open);
    else if (d.rm) { log = log.filter(function (x) { return x.id !== d.rm; }); saveLog(); drawNav(); drawLog(); }
  });
  window.addEventListener("resize", function () { if (frame && !tab().log && !tab().request) update(); });
  var q = (location.hash || "").replace("#", ""); TABS.forEach(function (t, i) { if (t.id === q) store.tab = i; });
  if (store.tab >= TABS.length) store.tab = 0;
  drawNav(); drawShell();
  window.MAKER = { store: store, go: go, renderCanvas: renderCanvas, TABS: TABS, getLog: function () { return log; }, nextNumber: nextNumber, fmtVals: fmtVals };
})();
