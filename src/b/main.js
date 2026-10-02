import './styles.css';
import { STORE } from '../config.js';
import * as S from '../store.js';
import { slotFor, figureSVG, garmentSVG, LAYER_ORDER } from './figurin.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Color de cada categoría en las tarjetas (fondo + acento)
const TINTS = {
  camisas: ['#f6dfe3', '#c8283c'],
  chombas: ['#fbeccb', '#c98a12'],
  remeras: ['#dfe9f7', '#2c5bd0'],
  sueteres: ['#f3e3d3', '#a8603a'],
  buzos: ['#e5e9e1', '#4f6b4a'],
  abrigos: ['#e1e4ec', '#13223f'],
  pantalones: ['#efe6d6', '#8a6a3c'],
  denim: ['#dbe4f1', '#1d3360'],
  calzado: ['#eadfd8', '#6b4632'],
  accesorios: ['#f0e2e6', '#9b2d4a'],
};
const tint = (cat) => TINTS[cat] || ['#ece5da', '#13223f'];

/* =========================================================
   Arranque
   ========================================================= */

async function init() {
  $('#year').textContent = new Date().getFullYear();
  initNav();
  initHeroSlides();
  renderStores();
  renderFAQ();
  await S.loadCatalog();
  renderAboutCard();
  renderChips();
  renderProducts();
  initFitting();
  renderCart();
  S.onCart(renderCart);
  bind();
  initReveal();
}

function initNav() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 60);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initHeroSlides() {
  const imgs = $$('#heroMedia img');
  const dots = $$('#heroDots button');
  let i = 0;
  const go = (n) => {
    i = (n + imgs.length) % imgs.length;
    imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
  };
  let timer = setInterval(() => go(i + 1), 6000);
  dots.forEach((d, k) =>
    d.addEventListener('click', () => {
      clearInterval(timer);
      go(k);
      timer = setInterval(() => go(i + 1), 6000);
    }),
  );
}

function initReveal() {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  $$('.reveal:not(.is-in)').forEach((el) => io.observe(el));
}

/* =========================================================
   Contenido fijo
   ========================================================= */
function renderStores() {
  $('#stores').innerHTML = STORE.stores
    .map(
      (s) => `<a class="vstore" href="${s.maps}" target="_blank" rel="noopener"><svg><use href="#i-pin"/></svg><div><strong>${esc(s.name)}</strong><span>${esc(s.address)} · ${esc(s.city)}</span></div><em>Cómo llegar →</em></a>`,
    )
    .join('');
}

const FAQ = [
  ['¿Cómo compro?', 'Elegí tus productos, tu talle y agregalos a la bolsa. Después iniciás la compra, cargás tus datos, elegís la forma de envío y el medio de pago. Te llega la confirmación por email.'],
  ['¿Cuáles son las formas de pago?', `Tarjetas de crédito y débito en ${STORE.installments.join(' y ')} cuotas sin interés, Mercado Pago y transferencia o depósito bancario con descuento.`],
  ['¿Puedo pagar por transferencia?', 'Sí. Elegí esa opción al finalizar la compra y te llegará un correo con los datos bancarios para hacer el pago.'],
  ['¿Cómo hacen los envíos?', 'Trabajamos con Correo Argentino para todo el país y con motomensajería en Rosario.'],
  ['¿Cuánto cuesta el envío?', `Es gratis en compras desde $${STORE.freeShippingFrom.toLocaleString('es-AR')}. Para montos menores, el costo depende de tu ciudad y provincia.`],
  ['¿Tienen locales a la calle?', 'Sí, dos en Rosario: Av. Pellegrini 911 y Shopping del Siglo (local 018, planta baja).'],
  ['¿Cómo aplico un cupón de descuento?', 'En la bolsa de compras vas a encontrar el campo “Cupón de descuento”. Cargalo antes de finalizar la compra.'],
  ['¿Puedo cambiar una prenda?', 'Sí. Podés cambiarla en cualquiera de nuestros locales o coordinar el cambio por WhatsApp.'],
];
function renderFAQ() {
  $('#faqList').innerHTML = FAQ.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
}

function renderAboutCard() {
  const p = S.getCatalog().products.find((x) => x.category === 'camisas' && !x.soldOut && /lino/i.test(x.title));
  if (p) $('#aboutCard').innerHTML = `<img src="${S.img(p.images[0], 480)}" alt="" loading="lazy"><span>${esc(p.title)}</span>`;
}

/* =========================================================
   Colección
   ========================================================= */
const shop = { cat: 'all', query: '', shown: 9 };

function renderChips() {
  const { categories, products } = S.getCatalog();
  const live = products.filter((p) => !p.soldOut);
  $('#chips').innerHTML =
    `<button class="chip${shop.cat === 'all' && !shop.query ? ' is-on' : ''}" data-chip="all">Todo · ${live.length}</button>` +
    categories.map((c) => `<button class="chip${shop.cat === c.id ? ' is-on' : ''}" data-chip="${c.id}">${esc(c.label)}</button>`).join('') +
    (shop.query ? `<button class="chip is-on" data-chip="all">“${esc(shop.query)}” ✕</button>` : '');
}

function shopList() {
  const q = norm(shop.query);
  return S.getCatalog()
    .products.filter((p) => (shop.cat === 'all' || p.category === shop.cat) && (!q || norm(p.title).includes(q)))
    .sort((a, b) => a.soldOut - b.soldOut || a.position - b.position);
}

function productCard(p) {
  const [bg, accent] = tint(p.category);
  const off = S.discountPct(p);
  const colorIdx = S.optionIndex(p, 'Color');
  const sub = colorIdx > -1 ? `${p.options[colorIdx].values.length} colores` : `Art. ${p.art}`;
  return `
  <article class="pcard reveal${p.soldOut ? ' is-out' : ''}" style="--tint:${bg};--accent:${accent}" data-open="${p.id}">
    <div class="pcard__media">
      <span class="pcard__tag">${esc(S.categoryLabel(p.category))}</span>
      ${off ? `<span class="pcard__off">−${off}%</span>` : p.soldOut ? '<span class="pcard__off">Agotado</span>' : ''}
      <img src="${S.img(p.images[0])}" alt="${esc(p.title)}" loading="lazy">
    </div>
    <div class="pcard__body">
      <h3 class="pcard__title">${esc(p.title)}</h3>
      <span class="pcard__sub">${esc(sub)}</span>
      <div class="pcard__stats">
        <div>${off ? `<s>${S.money(p.compareAt)}</s>` : ''}<b>${S.money(p.price)}</b><small>Precio</small></div>
        <div><b>${S.money(p.price / S.maxInstallments())}</b><small>${S.maxInstallments()} cuotas</small></div>
        <div><b>${S.money(S.transferPrice(p.price))}</b><small>Transfer.</small></div>
      </div>
      <div class="pcard__foot"><span>Ver producto</span><span class="pcard__go"><svg><use href="#i-arrow"/></svg></span></div>
    </div>
  </article>`;
}

function renderProducts() {
  const list = shopList();
  $('#products').innerHTML = list.slice(0, shop.shown).map(productCard).join('');
  $('#loadMore').style.display = list.length > shop.shown ? '' : 'none';
  $('#shopCount').textContent = `${list.length} prendas`;
  initReveal();
}

function setShop(patch, scroll) {
  Object.assign(shop, patch, { shown: 9 });
  renderChips();
  renderProducts();
  if (scroll) $('#coleccion').scrollIntoView({ behavior: 'smooth' });
}

/* =========================================================
   Probador
   ========================================================= */
const RACKS = [
  { id: 'top', side: 'left', title: 'Camisas y chombas', slots: ['top'] },
  { id: 'layer', side: 'left', title: 'Abrigo', slots: ['layer'] },
  { id: 'bottom', side: 'right', title: 'Pantalones', slots: ['bottom'] },
  { id: 'extra', side: 'right', title: 'Calzado y accesorios', slots: ['shoes', 'belt', 'scarf'] },
];
const PER_RACK = 6;
const fit = { equipped: {}, racks: {}, lastSlot: null };

function initFitting() {
  const live = S.getCatalog().products.filter((p) => !p.soldOut && slotFor(p));
  RACKS.forEach((r) => {
    const pool = live.filter((p) => r.slots.includes(slotFor(p)));
    fit.racks[r.id] = { pool: shuffle(pool), page: 0 };
  });
  renderRacks();
  // Look inicial para que el figurín no arranque vacío
  const pick = (slot, re) => live.find((p) => slotFor(p) === slot && re.test(p.title));
  [pick('top', /camisa de lino/i), pick('bottom', /chino gabardina/i), pick('shoes', /boating/i)].filter(Boolean).forEach((p) => equip(p, false));
  renderStage();
  renderOutfit();
}

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderRacks() {
  ['left', 'right'].forEach((side) => {
    $(side === 'left' ? '#railLeft' : '#railRight').innerHTML = RACKS.filter((r) => r.side === side)
      .map((r) => {
        const { pool, page } = fit.racks[r.id];
        const pages = Math.ceil(pool.length / PER_RACK);
        const items = pool.slice((page % pages) * PER_RACK, (page % pages) * PER_RACK + PER_RACK);
        return `
        <div class="rack">
          <div class="rack__head"><h3>${r.title}</h3>${pages > 1 ? `<button class="rack__more" data-rack="${r.id}">Ver otras ↻</button>` : ''}</div>
          <div class="rack__grid">${items
            .map((p) => {
              const on = fit.equipped[slotFor(p)]?.p.id === p.id;
              return `<button class="thumb${on ? ' is-on' : ''}" data-wear="${p.id}" title="${esc(p.title)}"><img src="${S.img(p.images[0], 480)}" alt="${esc(p.title)}" loading="lazy"><span class="thumb__price">${S.money(p.price)}</span></button>`;
            })
            .join('')}</div>
        </div>`;
      })
      .join('');
  });
}

function firstColor(p) {
  const ci = S.optionIndex(p, 'Color');
  if (ci < 0) return null;
  // El color de la foto que se tocó, si está disponible
  const fromPhoto = p.variants.find((v) => v.available && v.image === p.images[0]);
  return (fromPhoto || p.variants.find((v) => v.available))?.options[ci] ?? p.options[ci].values[0];
}

function equip(p, animate = true) {
  const slot = slotFor(p);
  if (fit.equipped[slot]?.p.id === p.id) {
    delete fit.equipped[slot];
    fit.lastSlot = null;
  } else {
    fit.equipped[slot] = { p, color: firstColor(p), variantId: null };
    autoVariant(fit.equipped[slot]);
    fit.lastSlot = animate ? slot : null;
  }
}

// Si queda una sola variante posible (ej. talle único), se elige sola
function autoVariant(item) {
  const opts = variantsFor(item);
  item.variantId = opts.length === 1 ? opts[0].id : opts.some((v) => v.id === item.variantId) ? item.variantId : null;
}
function variantsFor({ p, color }) {
  const ci = S.optionIndex(p, 'Color');
  return p.variants.filter((v) => v.available && (ci < 0 || v.options[ci] === color));
}

function renderStage() {
  const eq = fit.equipped;
  const inner = LAYER_ORDER.filter((s) => eq[s])
    .map((s) => garmentSVG(s, eq[s].p, eq[s].color, { tucked: !!eq.belt }).replace('class="g ', `class="g ${s === fit.lastSlot ? 'is-new ' : ''}`))
    .join('');
  const empty = !Object.keys(eq).length;
  $('#stage').innerHTML = figureSVG(inner) + (empty ? '<span class="stage__hint">Tocá una prenda para empezar</span>' : '');
}

function renderOutfit() {
  const items = ['layer', 'top', 'scarf', 'belt', 'bottom', 'shoes'].filter((s) => fit.equipped[s]).map((s) => ({ slot: s, ...fit.equipped[s] }));
  if (!items.length) {
    $('#outfit').innerHTML = '<p class="outfit__empty">Tu look está vacío. Elegí prendas de los costados o tocá <b>Sorprendeme</b>.</p>';
    return;
  }
  const total = items.reduce((n, i) => n + i.p.price, 0);
  $('#outfit').innerHTML = `
    <div class="outfit__list">${items
      .map((i) => {
        const ci = S.optionIndex(i.p, 'Color');
        const sizeOpts = variantsFor(i);
        const label = (v) => v.options.filter((_, k) => k !== ci).join(' · ');
        const sw =
          ci > -1
            ? `<div class="oitem__swatches">${i.p.options[ci].values
                .map((v) => {
                  const avail = i.p.variants.some((x) => x.available && x.options[ci] === v);
                  return `<button class="sw${v === i.color ? ' is-on' : ''}" style="--c:${S.swatch(v)}" title="${esc(S.colorName(v))}" data-color="${i.slot}" data-val="${esc(v)}" ${avail ? '' : 'disabled'}></button>`;
                })
                .join('')}</div>`
            : '';
        const sel =
          sizeOpts.length > 1
            ? `<select data-size="${i.slot}"><option value="">Elegí talle</option>${sizeOpts.map((v) => `<option value="${v.id}" ${v.id === i.variantId ? 'selected' : ''}>${esc(label(v) || 'Único')}</option>`).join('')}</select>`
            : `<small>${sizeOpts.length ? esc(label(sizeOpts[0]) || 'Talle único') : 'Sin stock en este color'}</small>`;
        return `
        <div class="oitem">
          <img src="${S.img(i.p.images[0], 480)}" alt="">
          <div><div class="oitem__name">${esc(i.p.title)}</div><div class="oitem__row">${sw}${sel}</div></div>
          <div class="oitem__right">${S.money(i.p.price)}<button data-unwear="${i.slot}">Quitar</button></div>
        </div>`;
      })
      .join('')}</div>
    <div class="outfit__total">
      <span>Total del look</span>
      <strong>${S.money(total)}</strong>
      <small>${S.maxInstallments()} cuotas sin interés de ${S.money(total / S.maxInstallments())}</small>
      <small>${total >= STORE.freeShippingFrom ? '✓ Con envío gratis' : `Te faltan ${S.money(STORE.freeShippingFrom - total)} para el envío gratis`}</small>
      <button class="btn btn--sol" id="addLook"><svg><use href="#i-bag"/></svg> Llevar el look</button>
    </div>`;
}

function flyToStage(fromEl) {
  const img = fromEl.querySelector('img');
  const a = img.getBoundingClientRect();
  const b = $('#stage').getBoundingClientRect();
  if (!a.width || b.bottom < 0 || b.top > innerHeight) return;
  const fly = img.cloneNode();
  fly.className = 'fly';
  Object.assign(fly.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  document.body.appendChild(fly);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height * 0.4 - (a.top + a.height / 2);
  fly.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: 0 }], {
    duration: 600,
    easing: 'cubic-bezier(.5,0,.2,1)',
  }).onfinish = () => fly.remove();
}

function surprise() {
  fit.equipped = {};
  const take = (slot) => {
    const rack = RACKS.find((r) => r.slots.includes(slot));
    const opts = fit.racks[rack.id].pool.filter((p) => slotFor(p) === slot);
    return opts[Math.floor(Math.random() * opts.length)];
  };
  const wear = (s) => {
    const p = take(s);
    if (p) equip(p, false);
  };
  ['top', 'bottom', 'shoes'].forEach(wear);
  if (Math.random() < 0.35) wear('layer');
  else if (Math.random() < 0.6) wear('belt');
  fit.lastSlot = null;
  renderStage();
  $$('#stage .g').forEach((g, k) => {
    g.classList.add('is-new');
    g.style.animationDelay = `${k * 0.12}s`;
  });
  renderOutfit();
  renderRacks();
}

function addLook() {
  const items = Object.values(fit.equipped);
  const missing = Object.entries(fit.equipped).filter(([, i]) => !i.variantId);
  if (missing.length) {
    missing.forEach(([slot]) => $(`[data-size="${slot}"]`)?.classList.add('is-missing'));
    toast('Elegí el talle de cada prenda para llevarte el look');
    return;
  }
  items.forEach((i) => S.addToCart(i.p.id, i.variantId));
  bump();
  toast('✓ Look completo en tu bolsa', true);
}

/* =========================================================
   Ficha de producto
   ========================================================= */
const modal = { p: null, sel: {} };

function openProduct(id) {
  const p = S.getProduct(id);
  if (!p) return;
  modal.p = p;
  modal.sel = {};
  const first = p.variants.find((v) => v.available) || p.variants[0];
  p.options.forEach((o, i) => (modal.sel[i] = o.name === 'Talle' && o.values.length > 1 ? null : first.options[i]));
  renderModal();
  toggle('#modal', true);
}

function renderModal() {
  const { p, sel } = modal;
  const v = S.findVariant(p, sel);
  const price = v?.price ?? p.price;
  const compare = v?.compareAt ?? p.compareAt;
  const ci = S.optionIndex(p, 'Color');
  const colorImg = ci > -1 ? p.variants.find((x) => x.options[ci] === sel[ci])?.image : null;
  const imgs = colorImg ? [colorImg, ...p.images.filter((i) => i !== colorImg)] : p.images;
  const opts = p.options
    .map((o, i) => {
      const avail = S.availableValues(p, i, sel);
      const vals =
        o.name === 'Color'
          ? o.values.map((val) => `<button class="sw${val === sel[i] ? ' is-on' : ''}" style="--c:${S.swatch(val)};width:34px;height:34px" title="${esc(S.colorName(val))}" data-opt="${i}" data-val="${esc(val)}" ${avail.has(val) ? '' : 'disabled'}></button>`)
          : o.values.map((val) => `<button class="sz${val === sel[i] ? ' is-on' : ''}" data-opt="${i}" data-val="${esc(val)}" ${avail.has(val) ? '' : 'disabled'}>${esc(val)}</button>`);
      return `<div class="opt"><h4>${o.name}${o.name === 'Color' && sel[i] ? ` · ${esc(S.colorName(sel[i]))}` : ''}</h4><div class="opt__vals">${vals.join('')}</div></div>`;
    })
    .join('');
  const ready = v?.available;
  const stock = ready ? (v.stock != null && v.stock <= 3 ? `<span class="mprod__stock is-low">¡Últimas ${v.stock} unidades en este talle!</span>` : '<span class="mprod__stock">✓ En stock, listo para enviar</span>') : '';
  const slot = slotFor(p);
  $('#modalBody').innerHTML = `
    <div class="mprod" style="--tint:${tint(p.category)[0]}">
      <div class="mprod__gallery">${imgs.slice(0, 3).map((src) => `<img src="${S.img(src, 'full')}" alt="${esc(p.title)}">`).join('')}</div>
      <div class="mprod__info">
        <span class="eyebrow">${esc(S.categoryLabel(p.category))}</span>
        <h3>${esc(p.title)}</h3>
        <div class="mprod__price">${S.money(price)}${compare && compare > price ? `<s>${S.money(compare)}</s>` : ''}</div>
        <div class="mprod__pay">
          <span><b>${S.maxInstallments()} cuotas sin interés</b> de ${S.money(price / S.maxInstallments())}</span>
          <span><b>${S.money(S.transferPrice(price))}</b> pagando por transferencia</span>
        </div>
        ${opts}
        ${stock}
        <button class="btn btn--navy btn--lg" id="modalAdd" ${ready ? '' : 'disabled'}>${p.soldOut ? 'Agotado' : ready ? `Agregar a la bolsa · ${S.money(price)}` : 'Elegí tu talle'}</button>
        ${slot && !p.soldOut ? `<button class="btn btn--outline" data-try="${p.id}">Probarlo en el probador</button>` : ''}
        <small style="color:var(--ink-soft)">Art. ${esc(p.art)} · Envío gratis desde ${S.money(STORE.freeShippingFrom)} · Cambios en nuestros locales</small>
      </div>
    </div>`;
}

/* =========================================================
   Bolsa
   ========================================================= */
function renderCart() {
  const lines = S.cartLines();
  const sub = S.cartSubtotal();
  $('#cartCount').textContent = S.cartCount();
  const pct = Math.min(100, (sub / STORE.freeShippingFrom) * 100);
  $('#ship').innerHTML = `${pct >= 100 ? '🎉 <b>¡Tenés envío gratis!</b>' : `Te faltan <b>${S.money(STORE.freeShippingFrom - sub)}</b> para el envío gratis`}<div class="bar"><i style="width:${pct}%"></i></div>`;
  $('#cartItems').innerHTML = lines.length
    ? lines
        .map((l) => {
          const opts = l.product.options.map((o, i) => (o.name === 'Color' ? S.colorName(l.variant.options[i]) : l.variant.options[i])).join(' · ');
          return `<div class="citem"><img src="${S.img(l.variant.image || l.product.images[0], 480)}" alt=""><div><h4>${esc(l.product.title)}</h4><small>${esc(opts)}</small><div class="qty"><button data-qty="${l.variantId}" data-d="-1">−</button><span>${l.qty}</span><button data-qty="${l.variantId}" data-d="1">+</button></div></div><div class="citem__r">${S.money(l.variant.price * l.qty)}<button data-remove="${l.variantId}">Quitar</button></div></div>`;
        })
        .join('')
    : '<div class="empty"><strong>Tu bolsa está vacía</strong><a href="#coleccion" class="btn btn--navy" data-close>Ver la colección</a></div>';
  $('#cartFoot').style.display = lines.length ? '' : 'none';
  if (lines.length)
    $('#cartFoot').innerHTML = `
      <div class="row"><span>Subtotal</span><span>${S.money(sub)}</span></div>
      <div class="row"><span>Envío</span><span>${pct >= 100 ? 'Gratis' : '<small>Se calcula al finalizar</small>'}</span></div>
      <div class="row row--total"><span>Total</span><span>${S.money(sub)}</span></div>
      <div class="row"><small>${S.maxInstallments()} cuotas de ${S.money(sub / S.maxInstallments())}</small><small>${S.money(S.transferPrice(sub))} por transferencia</small></div>
      <a class="btn btn--sol btn--lg" href="${S.whatsappCheckoutUrl()}" target="_blank" rel="noopener">Finalizar compra <svg><use href="#i-arrow"/></svg></a>
      <p class="drawer__note">Versión preliminar: el pedido se envía por WhatsApp.</p>`;
}

function bump() {
  const b = $('#openCart');
  b.classList.remove('is-bump');
  void b.offsetWidth;
  b.classList.add('is-bump');
}

let toastTimer;
function toast(msg, withCart = false) {
  const t = $('#toast');
  t.innerHTML = `<span>${msg}</span>${withCart ? '<button data-open-cart>Ver bolsa</button>' : ''}`;
  t.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-show'), 3200);
}

function toggle(sel, open) {
  $(sel).classList.toggle('is-open', open);
  $(sel).setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('is-locked', !!$('.modal.is-open, .drawer.is-open'));
}
const closeAll = () => ['#modal', '#drawer'].forEach((s) => toggle(s, false));

/* =========================================================
   Eventos
   ========================================================= */
function bind() {
  document.addEventListener('click', (e) => {
    const t = e.target;
    const wear = t.closest('[data-wear]');
    if (wear) {
      const p = S.getProduct(wear.dataset.wear);
      const wasOn = fit.equipped[slotFor(p)]?.p.id === p.id;
      if (!wasOn) flyToStage(wear);
      equip(p);
      setTimeout(renderStage, wasOn ? 0 : 380);
      renderOutfit();
      renderRacks();
      return;
    }
    const rack = t.closest('[data-rack]');
    if (rack) {
      fit.racks[rack.dataset.rack].page++;
      return renderRacks();
    }
    const unwear = t.closest('[data-unwear]');
    if (unwear) {
      delete fit.equipped[unwear.dataset.unwear];
      fit.lastSlot = null;
      renderStage();
      renderOutfit();
      return renderRacks();
    }
    const col = t.closest('[data-color]');
    if (col) {
      const item = fit.equipped[col.dataset.color];
      item.color = col.dataset.val;
      autoVariant(item);
      fit.lastSlot = col.dataset.color;
      renderStage();
      return renderOutfit();
    }
    if (t.closest('#addLook')) return addLook();
    if (t.closest('#surprise')) return surprise();
    if (t.closest('#undress')) {
      fit.equipped = {};
      renderStage();
      renderOutfit();
      return renderRacks();
    }

    const tryOn = t.closest('[data-try]');
    if (tryOn) {
      const p = S.getProduct(tryOn.dataset.try);
      closeAll();
      if (fit.equipped[slotFor(p)]?.p.id !== p.id) equip(p);
      renderStage();
      renderOutfit();
      renderRacks();
      return $('#probador').scrollIntoView({ behavior: 'smooth' });
    }

    const opt = t.closest('[data-opt]');
    if (opt) {
      modal.sel[+opt.dataset.opt] = opt.dataset.val;
      modal.p.options.forEach((_, k) => {
        if (k !== +opt.dataset.opt && modal.sel[k] && !S.availableValues(modal.p, k, modal.sel).has(modal.sel[k])) modal.sel[k] = null;
      });
      return renderModal();
    }
    if (t.closest('#modalAdd')) {
      const v = S.findVariant(modal.p, modal.sel);
      if (!v?.available) return;
      S.addToCart(modal.p.id, v.id);
      bump();
      closeAll();
      return toast(`✓ ${esc(modal.p.title)} en tu bolsa`, true);
    }
    const open = t.closest('[data-open]');
    if (open) return openProduct(open.dataset.open);

    if (t.closest('#openCart, [data-open-cart]')) {
      closeAll();
      return toggle('#drawer', true);
    }
    if (t.closest('[data-close]')) return closeAll();

    const q = t.closest('[data-qty]');
    if (q) {
      const line = S.getCart().find((l) => String(l.variantId) === q.dataset.qty);
      return S.setQty(line.variantId, line.qty + +q.dataset.d);
    }
    const rm = t.closest('[data-remove]');
    if (rm) return S.removeLine(+rm.dataset.remove);

    const chip = t.closest('[data-chip]');
    if (chip) return setShop({ cat: chip.dataset.chip, query: '' }, false);
    const cat = t.closest('[data-cat]');
    if (cat) {
      e.preventDefault();
      return setShop({ cat: cat.dataset.cat, query: '' }, true);
    }
    const fq = t.closest('[data-filter-query]');
    if (fq) return setShop({ cat: 'all', query: fq.dataset.filterQuery }, true);
  });

  document.addEventListener('change', (e) => {
    const s = e.target.closest('[data-size]');
    if (!s) return;
    fit.equipped[s.dataset.size].variantId = s.value ? +s.value : null;
    s.classList.remove('is-missing');
  });

  $('#loadMore').addEventListener('click', () => {
    shop.shown += 9;
    renderProducts();
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeAll());
}

init();
