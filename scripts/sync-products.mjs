// Sincroniza el catálogo desde la tienda actual (Tiendanube) a public/data/products.json.
// Puente temporal: en producción esto se reemplaza por la API oficial de Tiendanube
// (o el backend elegido) respetando el mismo formato de salida.
import fs from 'node:fs';
import sharp from 'sharp';

const BASE = 'https://www.surlacoteweb.com/productos/';
const OUT = new URL('../public/data/products.json', import.meta.url);
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (SurLaCote sync)' } };

const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const SIZE_RE = /^(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|\d{2,3}|U|ÚNICO)$/i;

// Orden de categorías = orden en que se muestran en la web
const CATEGORIES = [
  ['camisas', 'Camisas', /camisa/i],
  ['chombas', 'Chombas', /chomba/i],
  ['remeras', 'Remeras', /remera/i],
  ['sueteres', 'Suéteres', /su[eé]ter|cardigan/i],
  ['buzos', 'Buzos', /buzo/i],
  ['abrigos', 'Abrigos', /campera|chaleco|saco|piloto|parka/i],
  ['pantalones', 'Pantalones', /pantal[oó]n/i],
  ['denim', 'Denim', /denim|jean/i],
  ['calzado', 'Calzado', /zapatilla|borceg|mocas|nautic/i],
  ['accesorios', 'Accesorios', /cintur|bufanda|neceser|billetera/i],
];

const categorize = (name) => (CATEGORIES.find(([, , re]) => re.test(name)) || ['otros'])[0];

const splitName = (raw) => {
  const m = raw.match(/^(.*?)[\s.\-–]*\bart\b\.?[\s\-–.]*(.+)$/i);
  if (!m) return { title: raw.trim(), art: '' };
  return { title: m[1].replace(/[\s\-–.]+$/, '').trim(), art: m[2].trim() };
};

const prettyTitle = (t) => (t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t);

const imgBase = (u) => 'https:' + u.replace(/^https?:/, '').replace(/-\d+-\d+\.(webp|jpg|png)$/, '');

async function scrape() {
  const seen = new Map();
  for (let page = 1; page < 60; page++) {
    const url = page === 1 ? BASE : `${BASE}page/${page}/`;
    const res = await fetch(url, UA);
    if (!res.ok) break;
    const html = await res.text();
    const blocks = html.split('<div class="js-item-product').slice(1);
    if (!blocks.length) break;
    let added = 0;
    for (const b of blocks) {
      const id = b.match(/data-product-id="(\d+)"/)?.[1];
      if (!id || seen.has(id)) continue;
      const variants = JSON.parse(decode(b.match(/data-variants="([^"]+)"/)[1]));
      const link = b.match(/<a href="([^"]+)" title="([^"]+)"/);
      const images = [
        ...new Set(
          [...b.matchAll(/\/\/acdn-us\.mitiendanube\.com\/stores\/\d+\/\d+\/products\/[^"\s,]+?-\d+-\d+\.(?:webp|jpg|png)/g)].map(
            (m) => imgBase(m[0]),
          ),
        ),
      ];
      seen.set(id, { id, rawName: decode(link[2]), sourceUrl: link[1], variants, images });
      added++;
    }
    process.stdout.write(`página ${page}: +${added}\n`);
    if (!added) break;
  }
  return [...seen.values()];
}

function normalize(p, index) {
  const { title, art } = splitName(p.rawName);
  const v0 = p.variants[0];
  const dims = [0, 1, 2]
    .map((i) => [...new Set(p.variants.map((v) => v[`option${i}`]).filter(Boolean))])
    .filter((vals) => vals.length);
  const options = dims.map((vals) => ({
    name: vals.every((v) => SIZE_RE.test(v)) ? 'Talle' : vals.every((v) => /^V\d$/i.test(v)) ? 'Diseño' : 'Color',
    values: vals,
  }));
  const variants = p.variants.map((v) => ({
    id: v.id,
    options: options.map((_, i) => v[`option${i}`]),
    stock: v.stock, // null = stock infinito
    available: v.available && v.stock !== 0,
    price: v.price_number,
    compareAt: v.compare_at_price_number || null,
    image: v.image_url ? imgBase(v.image_url) : null,
  }));
  const availableStock = variants.filter((v) => v.available).reduce((n, v) => n + (v.stock ?? 99), 0);
  const images = [...new Set([...p.images, ...variants.map((v) => v.image).filter(Boolean)])];
  return {
    id: p.id,
    slug: p.sourceUrl.split('/productos/')[1]?.replace(/\/$/, '') || p.id,
    title: prettyTitle(title),
    art,
    category: categorize(p.rawName),
    price: v0.price_number,
    compareAt: v0.compare_at_price_number || null,
    images,
    options,
    variants,
    stock: availableStock,
    soldOut: availableStock === 0,
    position: index,
  };
}

/* ---------- Tonos de cada prenda (para el probador) ----------
   Se toma una zona de la foto según el tipo de prenda, se descartan el fondo blanco
   y se quedan los dos colores más frecuentes: tono base y tono secundario (rayas, cuadros). */
const REGIONS = {
  top: [0.38, 0.62, 0.36, 0.52],
  bottom: [0.36, 0.5, 0.62, 0.76],
  item: [0.2, 0.8, 0.2, 0.8],
};
const regionFor = (cat) =>
  ['pantalones', 'denim'].includes(cat) ? REGIONS.bottom : ['calzado', 'accesorios'].includes(cat) ? REGIONS.item : REGIONS.top;

const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const toneCache = new Map();

async function tones(base, cat) {
  const key = base + cat;
  if (toneCache.has(key)) return toneCache.get(key);
  try {
    const buf = Buffer.from(await (await fetch(`${base}-480-0.webp`, UA)).arrayBuffer());
    const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const [x0, x1, y0, y1] = regionFor(cat);
    const buckets = new Map();
    for (let y = Math.floor(info.height * y0); y < info.height * y1; y += 2)
      for (let x = Math.floor(info.width * x0); x < info.width * x1; x += 2) {
        const i = (y * info.width + x) * 3;
        const px = [data[i], data[i + 1], data[i + 2]];
        if (Math.min(...px) > 228) continue; // fondo
        const k = px.map((v) => v >> 4).join(',');
        const bk = buckets.get(k) || { n: 0, sum: [0, 0, 0] };
        bk.n++;
        px.forEach((v, j) => (bk.sum[j] += v));
        buckets.set(k, bk);
      }
    const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).map((b) => b.sum.map((s) => s / b.n));
    const first = ranked[0] || [230, 230, 230];
    const second = ranked.find((c) => dist(c, first) > 70) || first;
    const result = [hex(first), hex(second)];
    toneCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

async function pool(items, n, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: n }, async () => { while (queue.length) await fn(queue.shift()); }));
}

const raw = await scrape();
const products = raw.map(normalize);
process.stdout.write('Calculando tonos de prendas');
await pool(products, 10, async (p) => {
  p.tones = await tones(p.images[0], p.category);
  for (const v of p.variants) if (v.image) v.tones = await tones(v.image, p.category);
  process.stdout.write('.');
});
console.log();
const data = {
  updatedAt: new Date().toISOString(),
  categories: CATEGORIES.map(([id, label]) => ({ id, label })).filter((c) => products.some((p) => p.category === c.id)),
  products,
};
fs.writeFileSync(OUT, JSON.stringify(data, null, 1));
console.log(`OK: ${products.length} productos → public/data/products.json`);
const otros = products.filter((p) => p.category === 'otros');
if (otros.length) console.log('Sin categoría:', otros.map((p) => p.title).join(', '));
