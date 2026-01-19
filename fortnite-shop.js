// Fortnite Item Shop (unofficial data)
// Source: https://fortnite-api.com/v2/shop

const SHOP_URL = "https://fortnite-api.com/v2/shop";
const ROOT_ID = "fn-shop";

/** Basic escape to avoid HTML injection from API strings */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id} container in HTML`);
  return node;
}

/**
 * Extract offers from the API response without relying on a fixed schema.
 * We detect "offer-like" objects by presence of finalPrice + (brItems/cars/etc arrays).
 */
function extractOffers(apiJson) {
  const offers = [];
  const seen = new Set();

  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object") return;

    const looksLikeOffer =
      typeof node.finalPrice === "number" &&
      (Array.isArray(node.brItems) ||
        Array.isArray(node.cars) ||
        Array.isArray(node.instruments) ||
        Array.isArray(node.beans) ||
        Array.isArray(node.legoKits));

    if (looksLikeOffer) {
      const key =
        node.offerId ||
        node.devName ||
        node.newDisplayAsset?.id ||
        node.brItems?.[0]?.id ||
        node.cars?.[0]?.id ||
        crypto.randomUUID();

      if (!seen.has(key)) {
        seen.add(key);

        const mainItem =
          node.brItems?.[0] ||
          node.cars?.[0] ||
          node.instruments?.[0] ||
          node.beans?.[0] ||
          node.legoKits?.[0] ||
          null;

        const name =
          mainItem?.name ||
          node.layout?.name ||
          node.devName ||
          "Unknown item";

        const type =
          mainItem?.type?.displayValue ||
          mainItem?.type?.value ||
          "";

        const rarity =
          mainItem?.rarity?.displayValue ||
          mainItem?.rarity?.value ||
          "";

        const image =
          node.newDisplayAsset?.renderImages?.[0]?.image ||
          mainItem?.images?.featured ||
          mainItem?.images?.icon ||
          mainItem?.images?.large ||
          mainItem?.images?.small ||
          "";

        const category =
          node.layout?.category ||
          node.layout?.name ||
          "Shop";

        offers.push({
          key,
          name,
          type,
          rarity,
          price: node.finalPrice,
          regularPrice: node.regularPrice,
          image,
          category,
          inDate: node.inDate,
          outDate: node.outDate,
        });
      }
    }

    for (const v of Object.values(node)) walk(v);
  }

  // Many APIs keep payload under data; if not, fall back to root.
  walk(apiJson?.data ?? apiJson);
  return offers;
}

function groupByCategory(items) {
  const map = new Map();
  for (const it of items) {
    const k = it.category || "Shop";
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  return map;
}

function injectStyles(root) {
  const style = document.createElement("style");
  style.textContent = `
    .fn-wrap { font-family: system-ui, Arial, sans-serif; }
    .fn-header { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin: 8px 0 14px; }
    .fn-title { font-size: 20px; font-weight: 700; }
    .fn-sub { font-size: 12px; opacity: .75; }
    .fn-section { margin: 18px 0; }
    .fn-section h3 { margin: 0 0 10px; font-size: 16px; }
    .fn-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .fn-card { border: 1px solid rgba(0,0,0,.12); border-radius: 12px; overflow:hidden; background:#fff; }
    .fn-img { width: 100%; aspect-ratio: 1/1; object-fit: cover; background:#f3f3f3; display:block; }
    .fn-body { padding: 10px; }
    .fn-name { font-size: 13px; font-weight: 700; margin: 0 0 6px; }
    .fn-meta { font-size: 12px; opacity: .75; margin: 0 0 6px; }
    .fn-price { font-size: 13px; font-weight: 700; margin: 0; }
    .fn-badge { display:inline-block; font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(0,0,0,.15); margin-left: 6px; opacity:.85; }
    .fn-error { padding: 12px; border:1px solid rgba(255,0,0,.25); background: rgba(255,0,0,.06); border-radius: 12px; }
    .fn-loading { padding: 12px; opacity: .8; }
  `;
  root.appendChild(style);
}

function renderShop(rootNode, offers, fetchedAtIso) {
  const groups = groupByCategory(offers);

  const wrap = document.createElement("div");
  wrap.className = "fn-wrap";

  wrap.innerHTML = `
    <div class="fn-header">
      <div class="fn-title">Fortnite Item Shop</div>
      <div class="fn-sub">Ultima actualizare: ${escapeHtml(new Date(fetchedAtIso).toLocaleString())}</div>
    </div>
  `;

  for (const [category, items] of groups.entries()) {
    // optional: sort by price desc
    items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

    const section = document.createElement("section");
    section.className = "fn-section";
    section.innerHTML = `<h3>${escapeHtml(category)} <span class="fn-badge">${items.length}</span></h3>`;

    const grid = document.createElement("div");
    grid.className = "fn-grid";

    for (const it of items) {
      const card = document.createElement("div");
      card.className = "fn-card";

      const imgHtml = it.image
        ? `<img class="fn-img" src="${escapeHtml(it.image)}" alt="${escapeHtml(it.name)}" loading="lazy">`
        : `<div class="fn-img"></div>`;

      card.innerHTML = `
        ${imgHtml}
        <div class="fn-body">
          <p class="fn-name">${escapeHtml(it.name)}</p>
          <p class="fn-meta">${escapeHtml(it.type)}${it.rarity ? " • " + escapeHtml(it.rarity) : ""}</p>
          <p class="fn-price">${escapeHtml(it.price)} V-Bucks</p>
        </div>
      `;

      grid.appendChild(card);
    }

    section.appendChild(grid);
    wrap.appendChild(section);
  }

  rootNode.innerHTML = "";
  rootNode.appendChild(wrap);
}

// Simple daily cache: refresh after next 00:00 UTC (+2 minutes buffer)
function nextUtcMidnightPlus2m() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 2, 0));
  return next.getTime();
}

async function fetchShopWithCache() {
  const cacheKey = "fn_shop_cache_v1";
  const cachedRaw = localStorage.getItem(cacheKey);

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      if (cached?.expiresAt && Date.now() < cached.expiresAt && cached?.data) {
        return { data: cached.data, fetchedAt: cached.fetchedAt, fromCache: true };
      }
    } catch (_) {}
  }

  const res = await fetch(SHOP_URL, {
    method: "GET",
    mode: "cors",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Shop API failed: ${res.status} ${res.statusText}`);

  const json = await res.json();
  const fetchedAt = new Date().toISOString();

  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      fetchedAt,
      expiresAt: nextUtcMidnightPlus2m(),
      data: json,
    })
  );

  return { data: json, fetchedAt, fromCache: false };
}

async function init() {
  const root = el(ROOT_ID);
  injectStyles(root);
  root.innerHTML = `<div class="fn-loading">Se încarcă Item Shop...</div>`;

  try {
    const { data, fetchedAt } = await fetchShopWithCache();
    const offers = extractOffers(data);

    if (!offers.length) {
      root.innerHTML = `<div class="fn-error">Am primit răspuns, dar n-am găsit oferte în payload (schema s-ar putea să se fi schimbat).</div>`;
      return;
    }

    renderShop(root, offers, fetchedAt);
  } catch (err) {
    root.innerHTML = `
      <div class="fn-error">
        <b>Eroare la încărcarea Item Shop.</b><br>
        ${escapeHtml(err?.message || err)}
        <br><br>
        Dacă vezi în consola browserului “CORS”, folosește varianta cu proxy de mai jos.
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", init);
