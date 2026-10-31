/* Minimal PDF writer: each page is one JPEG image (page size = A4, or the size given). Pages are drawn on a canvas first, so fonts match the designs. */
(function () {
  "use strict";
  function dataUrlToBytes(u) { var b = atob(u.split(",")[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  // pages: [canvas] (each canvas = full A4 page) -> Uint8Array
  function makePdf(canvases, title) {
    var enc = new TextEncoder(), chunks = [], offsets = [], pos = 0;
    function add(x) { var u = typeof x === "string" ? enc.encode(x) : x; chunks.push(u); pos += u.length; }
    function obj(n, body) { offsets[n] = pos; add(n + " 0 obj\n"); add(body); add("\nendobj\n"); }
    var n = canvases.length, A4W = 595.28, A4H = 841.89;
    add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    var kids = []; for (var i = 0; i < n; i++) kids.push((3 + i * 3) + " 0 R");
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(2, "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>");
    for (var p = 0; p < n; p++) {
      // a page is either a canvas (drawn as A4) or {canvas, w, h} (page size in points)
      var pg = canvases[p].canvas ? canvases[p] : { canvas: canvases[p], w: A4W, h: A4H }, W = pg.w, H = pg.h;
      var cv = pg.canvas;
      var base = 3 + p * 3, jpg = dataUrlToBytes(cv.toDataURL("image/jpeg", 0.95));
      obj(base, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /XObject << /Im0 " + (base + 1) + " 0 R >> >> /Contents " + (base + 2) + " 0 R >>");
      offsets[base + 1] = pos; add((base + 1) + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + cv.width + " /Height " + cv.height +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpg.length + " >>\nstream\n"); add(jpg); add("\nendstream\nendobj\n");
      var content = "q " + W + " 0 0 " + H + " 0 0 cm /Im0 Do Q";
      obj(base + 2, "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream");
    }
    var info = 3 + n * 3; obj(info, "<< /Title (" + String(title || "Collateral").replace(/[()\\]/g, "") + ") /Producer (Collateral Maker) >>");
    var xref = pos; add("xref\n0 " + (info + 1) + "\n0000000000 65535 f \n");
    for (var k = 1; k <= info; k++) add(("0000000000" + offsets[k]).slice(-10) + " 00000 n \n");
    add("trailer\n<< /Size " + (info + 1) + " /Root 1 0 R /Info " + info + " 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
    var out = new Uint8Array(pos), o = 0; chunks.forEach(function (c) { out.set(c, o); o += c.length; });
    return out;
  }
  window.CM_PDF = { makePdf: makePdf };
})();
