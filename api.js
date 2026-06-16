/* Movimiento — storefront API client. Reads catalog + server-side cart/wishlist,
   keyed by a per-browser session token. Cart subtotal is re-priced server-side
   (authoritative). Checkout gated off via settings. */
(function () {
  const BASE = window.MOVI_API_BASE || "https://api.llulllab.com/movi-api";
  const CURRENCY = "USD";

  function token() {
    let t = localStorage.getItem("movi_token");
    if (!t) { t = "c_" + ((crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2))); localStorage.setItem("movi_token", t); }
    return t;
  }
  async function call(resource, params, extra) {
    const r = await fetch(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ resource, params }, extra || {})) });
    if (!r.ok) throw new Error("api " + resource + " " + r.status);
    return r.json();
  }
  const vid = x => (x && typeof x === "object") ? x.variant_id : x;  // accept snapshot or id

  window.MOVI = {
    currency: CURRENCY,
    products: q => call("products", q || {}),
    product: slug => call("product", { slug }),
    collections: () => call("collections", {}),
    collection: slug => call("collection", { slug }),
    search: q => call("search", {}, { q }),
    // cart (server-side, movimiento DB)
    cart: () => call("cart", { token: token() }),
    cartAdd: async (v, qty) => { await call("cart-add", { token: token(), variant_id: vid(v), qty: qty || 1 }); return call("cart", { token: token() }); },
    cartUpdate: async (variant_id, qty) => { await call("cart-update", { token: token(), variant_id, qty }); return call("cart", { token: token() }); },
    // wishlist (server-side)
    wishlist: () => call("wishlist", { token: token() }),
    wishlistToggle: async (v) => { await call("wishlist-toggle", { token: token(), variant_id: vid(v) }); return call("wishlist", { token: token() }); },
    newsletter: email => call("newsletter", { email }),
    review: r => call("review", r),
    checkout: async () => ({ enabled: false }),
  };
})();
