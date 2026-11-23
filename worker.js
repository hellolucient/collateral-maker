/**
 * HTTP Basic auth front door for the static Collateral Maker assets.
 * Any username is accepted; the password must match the SITE_PASSWORD secret.
 */
function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Mandara Collateral Maker", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

function passwordFromAuth(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6).trim());
    const i = decoded.indexOf(":");
    if (i < 0) return null;
    return decoded.slice(i + 1);
  } catch {
    return null;
  }
}

function passwordsEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  const n = Math.max(ba.length, bb.length);
  let out = ba.length ^ bb.length;
  for (let i = 0; i < n; i++) out |= (ba[i] || 0) ^ (bb[i] || 0);
  return out === 0;
}

export default {
  async fetch(request, env) {
    const expected = env.SITE_PASSWORD;
    if (!expected) return unauthorized();
    const given = passwordFromAuth(request.headers.get("Authorization"));
    if (!passwordsEqual(given, expected)) return unauthorized();
    if (!env.ASSETS) return new Response("Assets binding missing", { status: 500 });
    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "private");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};
