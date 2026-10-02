// Capa de datos: catálogo + bolsa. La UI sólo habla con este módulo, así que cambiar
// el origen del catálogo (JSON estático, API de Tiendanube, CMS) se hace acá.
import { STORE, SWATCHES } from './config.js';

const CATALOG_URL = import.meta.env.BASE_URL + 'data/products.json';
const CART_KEY = 'slc-cart-v1';

let catalog = { products: [], categories: [] };
const byId = new Map();

export async function loadCatalog() {
  const res = await fetch(CATALOG_URL);
  catalog = await res.json();
  catalog.products.forEach((p) => byId.set(p.id, p));
  return catalog;
}

export const getCatalog = () => catalog;
export const getProduct = (id) => byId.get(String(id));
export const categoryLabel = (id) => catalog.categories.find((c) => c.id === id)?.label ?? id;

/* ---------- Formato ---------- */
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: STORE.currency, maximumFractionDigits: 0 });
export const money = (n) => fmt.format(Math.round(n)).replace(/\s/g, '');

// Las imágenes del CDN de Tiendanube aceptan sufijo de tamaño
export const img = (base, size = 640) => (size === 'full' ? `${base}-1024-1024.webp` : `${base}-${size}-0.webp`);

export const colorName = (v) => v.replace(/\s*\d+$/, '').trim();
export const swatch = (v) => SWATCHES[colorName(v).toLowerCase()] ?? '#bbb';

export const discountPct = (p) => (p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0);
export const transferPrice = (price) => price * (1 - STORE.transferDiscount);
export const maxInstallments = () => Math.max(...STORE.installments);

export const optionIndex = (p, name) => p.options.findIndex((o) => o.name === name);

/** Valores de una opción que tienen al menos una variante disponible dado el resto elegido */
export function availableValues(p, optIdx, selected = {}) {
  return new Set(
    p.variants
      .filter((v) => v.available && Object.entries(selected).every(([i, val]) => +i === optIdx || val == null || v.options[i] === val))
      .map((v) => v.options[optIdx]),
  );
}

export function findVariant(p, selected) {
  return p.variants.find((v) => v.options.every((val, i) => selected[i] === val));
}

/* ---------- Bolsa ---------- */
const listeners = new Set();
let cart = read();

function read() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}
function save() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {}
  listeners.forEach((fn) => fn(cart));
}

export const onCart = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const getCart = () => cart;

export function addToCart(productId, variantId, qty = 1) {
  const line = cart.find((l) => l.variantId === variantId);
  const p = getProduct(productId);
  const v = p?.variants.find((x) => x.id === variantId);
  const max = v?.stock ?? 99;
  if (line) line.qty = Math.min(line.qty + qty, max);
  else cart.push({ productId: String(productId), variantId, qty: Math.min(qty, max) });
  save();
}
export function setQty(variantId, qty) {
  const line = cart.find((l) => l.variantId === variantId);
  if (!line) return;
  const v = getProduct(line.productId)?.variants.find((x) => x.id === variantId);
  line.qty = Math.max(0, Math.min(qty, v?.stock ?? 99));
  cart = cart.filter((l) => l.qty > 0);
  save();
}
export const removeLine = (variantId) => setQty(variantId, 0);

export function cartLines() {
  return cart
    .map((l) => {
      const product = getProduct(l.productId);
      const variant = product?.variants.find((v) => v.id === l.variantId);
      return product && variant ? { ...l, product, variant } : null;
    })
    .filter(Boolean);
}
export const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = () => cartLines().reduce((n, l) => n + l.variant.price * l.qty, 0);

/** Checkout provisorio: arma el pedido y lo manda por WhatsApp */
export function whatsappCheckoutUrl() {
  const lines = cartLines().map(
    (l) =>
      `• ${l.qty} x ${l.product.title} (Art. ${l.product.art}) — ${l.product.options
        .map((o, i) => `${o.name}: ${o.name === 'Color' ? colorName(l.variant.options[i]) : l.variant.options[i]}`)
        .join(', ')} — ${money(l.variant.price * l.qty)}`,
  );
  const msg = `¡Hola Sur La Côte! Quiero hacer este pedido:\n\n${lines.join('\n')}\n\nSubtotal: ${money(cartSubtotal())}`;
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
}
