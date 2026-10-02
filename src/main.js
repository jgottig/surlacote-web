import './styles.css';
import { STORE, CAMPAIGNS, LOOK_REELS } from './config.js';
import * as S from './store.js';
import * as M from './motion.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const PAGE = 16;

const state = { cat: 'all', sale: false, sort: 'featured', query: '', shown: PAGE };

/* =========================================================
   Arranque
   ========================================================= */
init();

async function init() {
  renderAnnouncements();
  renderStores();
  startClocks();
  $('#year').textContent = new Date().getFullYear();

  M.initSmoothScroll();
  M.initHeader();
  const intro = M.playIntro();

  await S.loadCatalog();
  renderPostcards();
  renderCampaigns();
  renderChips();
  renderGrid();
  initLook();
  renderCart();
  S.onCart(renderCart);
  bindUI();

  M.initHero();
  M.initManifesto();
  M.initCampaigns();
  M.initCursor();
  intro.eventCallback('onComplete', () => M.ScrollTrigger.refresh());
}

/* =========================================================
   Bloques estáticos
   ========================================================= */
function renderAnnouncements() {
  const items = STORE.announcements.map((a) => `<span>${esc(a)}</span>`).join('');
  $('.announce__track').innerHTML = items + items + items + items;
}

function renderStores() {
  const compass = `<svg class="store__compass" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1"><circle cx="50" cy="50" r="48"/><circle cx="50" cy="50" r="36"/><path d="M50 2v96M2 50h96M50 14l6 36-6 36-6-36z"/></svg>`;
  $('#stores').innerHTML = STORE.stores
    .map(
      (s, i) => `
      <article class="store">
        ${compass}
        <span class="store__n">0${i + 1} — Rosario</span>
        <div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.address)}<br>${esc(s.city)}</p>
          <a class="store__link" href="${s.maps}" target="_blank" rel="noopener">Cómo llegar ↗</a>
        </div>
      </article>`,
    )
    .join('');
}

function startClocks() {
  const f = (tz) => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).format(new Date());
  const tick = () => {
    $('#clockAr').textContent = f('America/Argentina/Cordoba');
    $('#clockFr').textContent = f('Europe/Paris');
  };
  tick();
  setInterval(tick, 15000);
}

/* =========================================================
   Postales de categorías
   ========================================================= */
function renderPostcards() {
  const { categories, products } = S.getCatalog();
  const rail = $('#postcards');
  const towns = ['Nice', 'Cannes', 'Antibes', 'Menton', 'Saint-Tropez', 'Monaco', 'Biarritz', 'Marseille', 'Èze', 'Rosario'];
  rail.innerHTML = categories
    .map((c, i) => {
      const items = products.filter((p) => p.category === c.id && !p.soldOut);
      const hero = items.find((p) => p.images.length > 1) || items[0];
      if (!hero) return '';
      return `
      <button class="postcard" style="--r:${i % 2 ? 1.6 : -1.4}deg" data-cat="${c.id}">
        <div class="postcard__img"><img loading="lazy" src="${S.img(hero.images[0], 480)}" alt="${esc(c.label)}"></div>
        <span class="postcard__stamp">${towns[i % towns.length]}<br>✦<br>${String(items.length).padStart(2, '0')}</span>
        <div class="postcard__row">
          <span class="postcard__name">${esc(c.label)}</span>
          <span class="postcard__count">${items.length} piezas →</span>
        </div>
      </button>`;
    })
    .join('');
  M.dragScroll(rail);
}

/* =========================================================
   Colecciones
   ========================================================= */
function renderCampaigns() {
  $('#campaigns').innerHTML = CAMPAIGNS.map(
    (c, i) => `
    <article class="campaign">
      <div>
        <span class="campaign__index">0${i + 1} / 0${CAMPAIGNS.length}</span>
        <span class="campaign__kicker">${esc(c.kicker)}</span>
        <h3 class="campaign__title">${esc(c.title)}</h3>
        <p class="campaign__text">${esc(c.text)}</p>
        <button class="btn" data-campaign="${i}">Ver ${esc(c.title.toLowerCase())} <span class="btn__arrow">→</span></button>
      </div>
      <div class="campaign__media" style="--focus:${c.focus || '100%'}"><img loading="lazy" src="${c.image}" alt="Campaña ${esc(c.title)}"></div>
    </article>`,
  ).join('');
}

/* =========================================================
   Tienda
   ========================================================= */
function renderChips() {
  const { categories, products } = S.getCatalog();
  const live = products.filter((p) => !p.soldOut);
  const chip = (id, label, n) =>
    `<button class="chip${state.cat === id ? ' is-active' : ''}" data-chip="${id}" role="tab">${esc(label)} <sup>${n}</sup></button>`;
  $('#chips').innerHTML =
    chip('all', 'Todo', live.length) +
    categories.map((c) => chip(c.id, c.label, live.filter((p) => p.category === c.id).length)).join('');
}

function normalizeText(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function filtered() {
  const q = normalizeText(state.query);
  let list = S.getCatalog().products.filter(
    (p) =>
      (state.cat === 'all' || p.category === state.cat) &&
      (!state.sale || S.discountPct(p) > 0) &&
      (!q || normalizeText(`${p.title} ${p.art} ${S.categoryLabel(p.category)}`).includes(q)),
  );
  const sorters = {
    featured: (a, b) => a.soldOut - b.soldOut || a.position - b.position,
    'price-asc': (a, b) => a.soldOut - b.soldOut || a.price - b.price,
    'price-desc': (a, b) => a.soldOut - b.soldOut || b.price - a.price,
    discount: (a, b) => a.soldOut - b.soldOut || S.discountPct(b) - S.discountPct(a),
  };
  return list.sort(sorters[state.sort]);
}

function cardHTML(p) {
  const off = S.discountPct(p);
  const sizeIdx = S.optionIndex(p, 'Talle');
  const colorIdx = S.optionIndex(p, 'Color');
  const low = !p.soldOut && p.stock <= 3;
  const badges = [
    p.soldOut && '<span class="badge badge--out">Agotado</span>',
    off && `<span class="badge badge--sale">−${off}%</span>`,
    low && `<span class="badge badge--low">${p.stock === 1 ? 'Última unidad' : `Últimas ${p.stock}`}</span>`,
  ]
    .filter(Boolean)
    .join('');
  let quick = '';
  if (!p.soldOut && sizeIdx > -1) {
    const avail = S.availableValues(p, sizeIdx);
    quick = `<div class="card__quick"><p>${colorIdx > -1 ? 'Elegí talle · ver colores' : 'Agregar rápido · talle'}</p><div class="sizes">${p.options[sizeIdx].values
      .map((v) => `<button class="size" data-quick="${esc(v)}" ${avail.has(v) ? '' : 'disabled'}>${esc(v)}</button>`)
      .join('')}</div></div>`;
  }
  const dots =
    colorIdx > -1
      ? `<div class="card__dots">${p.options[colorIdx].values
          .slice(0, 6)
          .map((v) => `<span class="dot" style="--c:${S.swatch(v)}" title="${esc(S.colorName(v))}"></span>`)
          .join('')}</div>`
      : '';
  return `
  <article class="card${p.soldOut ? ' is-out' : ''}" data-id="${p.id}">
    <div class="card__media" data-open="${p.id}">
      <div class="card__badges">${badges}</div>
      <img loading="lazy" src="${S.img(p.images[0])}" alt="${esc(p.title)}">
      ${p.images[1] ? `<img class="alt" loading="lazy" src="${S.img(p.images[1])}" alt="">` : ''}
      ${quick}
    </div>
    <div class="card__info">
      <div>
        <h3 class="card__title"><a href="#" data-open="${p.id}">${esc(p.title)}</a></h3>
        <span class="card__art">Art. ${esc(p.art)}</span>
        ${dots}
      </div>
      <div class="card__price">${off ? `<s>${S.money(p.compareAt)}</s>` : ''}${S.money(p.price)}</div>
    </div>
  </article>`;
}

function renderGrid() {
  const list = filtered();
  const grid = $('#grid');
  grid.innerHTML = list.length
    ? list.slice(0, state.shown).map(cardHTML).join('')
    : `<p class="empty">Nada por acá todavía… probá otra búsqueda.</p>`;
  $('#loadMore').style.display = list.length > state.shown ? '' : 'none';
  const label = state.query ? `“${state.query}” · ` : '';
  $('#shopCount').textContent = `${label}${list.length} piezas`;
  M.revealCards($$('.card', grid));
}

function appendMore() {
  const list = filtered();
  const from = state.shown;
  state.shown += PAGE;
  const grid = $('#grid');
  grid.insertAdjacentHTML('beforeend', list.slice(from, state.shown).map(cardHTML).join(''));
  $('#loadMore').style.display = list.length > state.shown ? '' : 'none';
  M.revealCards($$('.card', grid).slice(from));
}

function setFilter(patch, scroll = true) {
  Object.assign(state, patch, { shown: PAGE });
  $$('.chip').forEach((c) => c.classList.toggle('is-active', c.dataset.chip === state.cat));
  $('#onlySale').checked = state.sale;
  $('#sort').value = state.sort;
  renderGrid();
  if (scroll) M.scrollToEl($('#tienda'), -40);
}

/* =========================================================
   Ficha de producto
   ========================================================= */
const pdp = { product: null, selected: {} };

function openProduct(id, preset = {}) {
  const p = S.getProduct(id);
  if (!p) return;
  pdp.product = p;
  pdp.selected = {};
  // Preselección: lo pedido o la primera combinación disponible
  const first = p.variants.find((v) => v.available) || p.variants[0];
  p.options.forEach((o, i) => {
    pdp.selected[i] = preset[o.name] ?? (o.values.length === 1 || o.name !== 'Talle' ? first.options[i] : null);
  });
  if (preset.Talle) {
    const v = p.variants.find((x) => x.available && x.options[S.optionIndex(p, 'Talle')] === preset.Talle);
    if (v) p.options.forEach((o, i) => o.name !== 'Talle' && (pdp.selected[i] = v.options[i]));
  }
  renderPDP(true);
  toggleLayer('#productSheet', true);
}

function renderPDP(fresh = false) {
  const p = pdp.product;
  const off = S.discountPct(p);
  const variant = S.findVariant(p, pdp.selected);
  const price = variant?.price ?? p.price;
  const compare = variant?.compareAt ?? p.compareAt;
  const colorIdx = S.optionIndex(p, 'Color');

  // Galería: si hay color elegido, su imagen va primero
  if (fresh || colorIdx > -1) {
    const colorImg = colorIdx > -1 ? p.variants.find((v) => v.options[colorIdx] === pdp.selected[colorIdx])?.image : null;
    const imgs = colorImg ? [colorImg, ...p.images.filter((i) => i !== colorImg)] : p.images;
    $('#pdpGallery').innerHTML = imgs.map((src, i) => `<img src="${S.img(src, 'full')}" alt="${esc(p.title)} ${i + 1}" ${i ? 'loading="lazy"' : ''}>`).join('');
    if (fresh) $('#pdpGallery').scrollTo(0, 0);
  }

  const options = p.options
    .map((o, i) => {
      const avail = S.availableValues(p, i, pdp.selected);
      const sel = pdp.selected[i];
      const label = o.name === 'Color' && sel ? S.colorName(sel) : sel ?? 'Elegí una opción';
      const buttons =
        o.name === 'Color'
          ? `<div class="swatches">${o.values
              .map(
                (v) =>
                  `<button class="swatch${v === sel ? ' is-active' : ''}" data-opt="${i}" data-val="${esc(v)}" title="${esc(S.colorName(v))}" ${avail.has(v) ? '' : 'disabled'}><i style="--c:${S.swatch(v)}"></i></button>`,
              )
              .join('')}</div>`
          : `<div class="sizes">${o.values
              .map((v) => `<button class="size${v === sel ? ' is-active' : ''}" data-opt="${i}" data-val="${esc(v)}" ${avail.has(v) ? '' : 'disabled'}>${esc(v)}</button>`)
              .join('')}</div>`;
      return `<div class="opt"><div class="opt__label"><span>${o.name}</span><span>${esc(label)}</span></div>${buttons}</div>`;
    })
    .join('');

  let stock = '';
  if (variant && variant.available) {
    const n = variant.stock;
    stock = n != null && n <= 3 ? `<div class="pdp__stock is-low"><i></i>¡Apurate! ${n === 1 ? 'Queda 1 sola' : `Quedan ${n}`} en este talle</div>` : `<div class="pdp__stock"><i></i>En stock · listo para enviar</div>`;
  } else if (variant) stock = `<div class="pdp__stock">Sin stock en esta combinación</div>`;

  const ready = variant && variant.available;
  const pair = pairings(p)
    .map((x) => `<button data-open="${x.id}"><img loading="lazy" src="${S.img(x.images[0], 480)}" alt="">${esc(x.title)}<br><b>${S.money(x.price)}</b></button>`)
    .join('');

  $('#pdpInfo').innerHTML = `
    <div>
      <div class="pdp__crumbs">${esc(S.categoryLabel(p.category))}${off ? ` · <span style="color:var(--rouge)">−${off}% OFF</span>` : ''}</div>
    </div>
    <div>
      <h2 class="pdp__title">${esc(p.title)}</h2>
      <div class="pdp__art">Art. ${esc(p.art)}</div>
    </div>
    <div class="pdp__prices">
      <span class="pdp__price">${S.money(price)}</span>
      ${compare && compare > price ? `<s>${S.money(compare)}</s>` : ''}
    </div>
    <div class="pdp__pay">
      <span>Hasta <b>${S.maxInstallments()} cuotas sin interés</b> de ${S.money(price / S.maxInstallments())}</span>
      <span><b>${S.money(S.transferPrice(price))}</b> pagando por transferencia</span>
      <span>${price >= STORE.freeShippingFrom ? '✦ Este producto tiene <b>envío gratis</b>' : `Envío gratis desde ${S.money(STORE.freeShippingFrom)}`}</span>
    </div>
    ${options}
    ${stock}
    <div class="pdp__add">
      <button class="btn btn--block" id="pdpAdd" ${ready ? '' : 'disabled'}>${
        p.soldOut ? 'Agotado' : ready ? `Agregar a la bolsa — ${S.money(price)}` : 'Elegí tu talle'
      }</button>
    </div>
    <div class="pdp__notes">
      <details><summary>Envíos</summary><p>Enviamos a todo el país por Correo Argentino y en Rosario por motomensajería. Gratis en compras desde ${S.money(STORE.freeShippingFrom)}.</p></details>
      <details><summary>Cambios y devoluciones</summary><p>Podés cambiar tu prenda en nuestros locales de Rosario o coordinar el cambio por WhatsApp.</p></details>
      <details><summary>Medios de pago</summary><p>Tarjetas de crédito y débito en ${STORE.installments.join(' y ')} cuotas sin interés, Mercado Pago y transferencia bancaria con descuento.</p></details>
    </div>
    ${pair ? `<div class="pdp__pair"><h4>Completá el look</h4><div class="pair">${pair}</div></div>` : ''}
  `;
  if (fresh) $('#pdpInfo').scrollTo(0, 0);
}

// Sugerencias de otras categorías que combinan
function pairings(p) {
  const reel = LOOK_REELS.find((r) => r.categories.includes(p.category));
  const pool = S.getCatalog().products.filter((x) => !x.soldOut && x.id !== p.id && !(reel && reel.categories.includes(x.category)));
  const seed = [...p.id].reduce((n, c) => n + c.charCodeAt(0), 0);
  const picks = [];
  for (let i = 0; picks.length < 3 && i < pool.length; i++) {
    const x = pool[(seed * (i + 7)) % pool.length];
    if (!picks.includes(x) && !picks.some((y) => y.category === x.category)) picks.push(x);
  }
  return picks;
}

/* =========================================================
   Bolsa
   ========================================================= */
function renderCart() {
  const lines = S.cartLines();
  const count = S.cartCount();
  const subtotal = S.cartSubtotal();
  $('#cartCount').textContent = count;
  $('#cartCountTitle').textContent = count ? `(${count})` : '';

  const goal = STORE.freeShippingFrom;
  const pct = Math.min(1, subtotal / goal);
  const missing = goal - subtotal;
  $('#voyage').innerHTML = `
    <div class="voyage__msg">${
      pct >= 1
        ? '⚓ <b>¡Llegaste a puerto!</b> Tu envío es gratis.'
        : `Te faltan <b>${S.money(missing)}</b> para el <b>envío gratis</b>`
    }</div>
    <div class="voyage__sea">
      <svg class="voyage__boat" style="left:${4 + pct * 88}%" viewBox="0 0 40 34"><path d="M20 2v22M20 4 33 22H20z" fill="#faf7f1" stroke="#0f1b33" stroke-width="1.4" stroke-linejoin="round"/><path d="M19 7 9 22h10" fill="#1f4fbf"/><path d="M4 25h32l-5 7H9z" fill="#0f1b33"/><path d="M20 2l7 2-7 2" fill="#d7263d"/></svg>
      <svg class="voyage__port" viewBox="0 0 22 40"><path d="M7 38 9 10h4l2 28z" fill="#faf7f1" stroke="#0f1b33" stroke-width="1.2"/><path d="M8.3 20h5.4M7.8 28h6.4" stroke="#d7263d" stroke-width="3"/><rect x="8" y="4" width="6" height="6" fill="#f2cf4a" stroke="#0f1b33" stroke-width="1.2"/><path d="M7 4h8L11 0z" fill="#0f1b33"/></svg>
      <svg class="wave" viewBox="0 0 400 16" preserveAspectRatio="none"><path d="M0 8 Q 12.5 0 25 8 T 50 8 T 75 8 T 100 8 T 125 8 T 150 8 T 175 8 T 200 8 T 225 8 T 250 8 T 275 8 T 300 8 T 325 8 T 350 8 T 375 8 T 400 8 V16 H0z" fill="#1d3f6e" opacity=".85"/></svg>
    </div>`;

  $('#cartItems').innerHTML = lines.length
    ? lines
        .map((l) => {
          const opts = l.product.options
            .map((o, i) => `${o.name}: ${o.name === 'Color' ? S.colorName(l.variant.options[i]) : l.variant.options[i]}`)
            .join(' · ');
          return `
        <div class="line">
          <img src="${S.img(l.variant.image || l.product.images[0], 480)}" alt="">
          <div>
            <p class="line__title">${esc(l.product.title)}</p>
            <div class="line__meta">${esc(opts)}</div>
            <div class="qty"><button data-qty="${l.variantId}" data-d="-1" aria-label="Restar">−</button><span>${l.qty}</span><button data-qty="${l.variantId}" data-d="1" aria-label="Sumar">+</button></div>
          </div>
          <div class="line__right"><span>${S.money(l.variant.price * l.qty)}</span><button class="line__remove" data-remove="${l.variantId}">Quitar</button></div>
        </div>`;
        })
        .join('')
    : `<div class="cart__empty"><p>Tu bolsa está esperando el viento a favor.</p><a href="#tienda" class="btn btn--ghost" data-close>Ir a la tienda</a></div>`;

  $('#cartFoot').style.display = lines.length ? '' : 'none';
  if (lines.length) {
    $('#cartFoot').innerHTML = `
      <div class="cart__row"><span>Subtotal</span><span>${S.money(subtotal)}</span></div>
      <div class="cart__row"><span>Envío</span><span>${pct >= 1 ? 'Gratis' : '<small>Se calcula al finalizar</small>'}</span></div>
      <div class="cart__row cart__row--total"><span>Total</span><span>${S.money(subtotal)}</span></div>
      <div class="cart__row"><small>${S.maxInstallments()} cuotas sin interés de ${S.money(subtotal / S.maxInstallments())}</small><small>o ${S.money(S.transferPrice(subtotal))} por transferencia</small></div>
      <a class="btn btn--block" href="${S.whatsappCheckoutUrl()}" target="_blank" rel="noopener">Finalizar compra <span class="btn__arrow">→</span></a>
      <p class="cart__note">Versión preliminar: el pedido se envía por WhatsApp. En producción se conecta al checkout con Mercado Pago.</p>`;
  }
}

function added(productId, variantId) {
  const p = S.getProduct(productId);
  const v = p.variants.find((x) => x.id === variantId);
  S.addToCart(productId, variantId);
  const btn = $('#openCart');
  btn.classList.remove('is-bump');
  void btn.offsetWidth;
  btn.classList.add('is-bump');
  toast(`<img src="${S.img(v.image || p.images[0], 480)}" alt=""><span>${esc(p.title)} a la bolsa</span><button data-open-cart>Ver bolsa</button>`);
}

let toastTimer;
function toast(html) {
  const t = $('#toast');
  t.innerHTML = html;
  t.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-show'), 3200);
}

/* =========================================================
   Armá tu look
   ========================================================= */
const look = { reels: [] };

function initLook() {
  const all = S.getCatalog().products.filter((p) => !p.soldOut);
  look.reels = LOOK_REELS.map((r) => ({
    ...r,
    pool: shuffle(all.filter((p) => r.categories.includes(p.category))),
    index: 0,
    locked: false,
    variantId: null,
  }));
  $('#reels').innerHTML = look.reels
    .map(
      (r, i) => `
    <div class="reel" data-reel="${i}">
      <div class="reel__top"><span>0${i + 1} · ${r.label}</span>
        <div class="reel__arrows"><button data-step="-1" aria-label="Anterior">↑</button><button data-step="1" aria-label="Siguiente">↓</button></div>
      </div>
      <div class="reel__window"><button class="reel__lock" data-lock>Fijar</button><img alt=""></div>
      <div class="reel__name"></div>
      <div class="reel__row"><span class="reel__price"></span><select aria-label="Talle"></select></div>
    </div>`,
    )
    .join('');
  look.reels.forEach((_, i) => paintReel(i));
  updateLookTotal();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const reelProduct = (r) => r.pool[((r.index % r.pool.length) + r.pool.length) % r.pool.length];

function paintReel(i) {
  const r = look.reels[i];
  const p = reelProduct(r);
  const el = $(`[data-reel="${i}"]`);
  $('img', el).src = S.img(p.images[0], 480);
  $('img', el).alt = p.title;
  $('.reel__window', el).dataset.open = p.id;
  $('.reel__name', el).innerHTML = `${esc(p.title)}<small>${esc(S.categoryLabel(p.category))} · Art. ${esc(p.art)}</small>`;
  $('.reel__price', el).textContent = S.money(p.price);
  const opts = p.variants
    .filter((v) => v.available)
    .map((v) => `<option value="${v.id}">${esc(v.options.map((o, k) => (p.options[k].name === 'Color' ? S.colorName(o) : o)).join(' · '))}</option>`);
  const select = $('select', el);
  select.innerHTML = (opts.length > 1 ? `<option value="">Elegí ${p.options.map((o) => o.name.toLowerCase()).join(' y ')}</option>` : '') + opts.join('');
  r.variantId = opts.length === 1 ? p.variants.find((v) => v.available).id : null;
}

function spinReel(i, steps, animate = true) {
  const r = look.reels[i];
  if (r.locked) return Promise.resolve();
  const el = $(`[data-reel="${i}"]`);
  const imgEl = $('img', el);
  if (!animate) {
    r.index += steps;
    paintReel(i);
    return Promise.resolve();
  }
  const dir = Math.sign(steps) || 1;
  const spins = Math.abs(steps);
  return new Promise((resolve) => {
    const tl = M.gsap.timeline({ onComplete: resolve });
    for (let s = 0; s < spins; s++) {
      const last = s === spins - 1;
      const d = last ? 0.45 : 0.08;
      tl.to(imgEl, { yPercent: -100 * dir, filter: last ? 'blur(0px)' : 'blur(6px)', duration: d, ease: last ? 'power2.in' : 'none' })
        .add(() => {
          r.index += dir;
          imgEl.src = S.img(reelProduct(r).images[0], 480);
        })
        .fromTo(imgEl, { yPercent: 100 * dir }, { yPercent: 0, filter: 'blur(0px)', duration: last ? 0.7 : 0.08, ease: last ? 'back.out(1.4)' : 'none' });
    }
    tl.add(() => {
      paintReel(i);
      updateLookTotal();
    });
  });
}

function shuffleLook() {
  look.reels.forEach((r, i) => setTimeout(() => spinReel(i, 6 + i * 3 + Math.floor(Math.random() * 4)), i * 90));
}

function updateLookTotal() {
  const total = look.reels.reduce((n, r) => n + reelProduct(r).price, 0);
  $('#lookTotal').textContent = S.money(total);
  $('#lookInstallments').textContent = `${S.maxInstallments()} cuotas sin interés de ${S.money(total / S.maxInstallments())}`;
}

function addLook() {
  const missing = look.reels.filter((r) => !r.variantId);
  if (missing.length) {
    missing.forEach((r) => {
      const sel = $(`[data-reel="${look.reels.indexOf(r)}"] select`);
      M.gsap.fromTo(sel, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      sel.style.borderColor = 'var(--rouge)';
    });
    toast(`<span>Elegí el talle de cada prenda para llevarte el look</span>`);
    return;
  }
  look.reels.forEach((r) => S.addToCart(reelProduct(r).id, r.variantId));
  toast(`<span>✦ Look completo en tu bolsa</span><button data-open-cart>Ver bolsa</button>`);
  $('#openCart').classList.add('is-bump');
}

/* =========================================================
   Búsqueda
   ========================================================= */
function renderSearch() {
  const q = normalizeText($('#searchInput').value.trim());
  const hints = ['Lino', 'Pima', 'Chomba rayada', 'Campera', 'Cinturón', 'Denim', 'Suéter'];
  $('#searchHints').innerHTML = hints.map((h) => `<button class="chip" data-hint="${h}">${h}</button>`).join('');
  const res = q
    ? S.getCatalog()
        .products.filter((p) => normalizeText(`${p.title} ${p.art} ${S.categoryLabel(p.category)}`).includes(q))
        .sort((a, b) => a.soldOut - b.soldOut)
        .slice(0, 24)
    : [];
  $('#searchResults').innerHTML = res
    .map((p) => `<button class="result" data-open="${p.id}"><img loading="lazy" src="${S.img(p.images[0], 480)}" alt="">${esc(p.title)}<b>${S.money(p.price)}</b></button>`)
    .join('');
}

/* =========================================================
   Capas (ficha, bolsa, búsqueda, menú)
   ========================================================= */
function toggleLayer(sel, open) {
  const el = $(sel);
  el.classList.toggle('is-open', open);
  el.setAttribute('aria-hidden', String(!open));
  const anyOpen = $$('.sheet.is-open, .drawer.is-open, .search.is-open').length > 0;
  M.lockScroll(anyOpen);
}

function closeAll() {
  ['#productSheet', '#cartDrawer', '#search'].forEach((s) => toggleLayer(s, false));
  document.body.classList.remove('menu-open');
}

function openSearch() {
  closeAll();
  toggleLayer('#search', true);
  renderSearch();
  setTimeout(() => $('#searchInput').focus(), 50);
}

/* =========================================================
   Eventos
   ========================================================= */
function bindUI() {
  document.addEventListener('click', (e) => {
    const t = e.target;

    const quick = t.closest('[data-quick]');
    if (quick) {
      e.stopPropagation();
      const p = S.getProduct(quick.closest('.card').dataset.id);
      const sizeIdx = S.optionIndex(p, 'Talle');
      if (p.options.length === 1) {
        const v = p.variants.find((x) => x.available && x.options[sizeIdx] === quick.dataset.quick);
        if (v) added(p.id, v.id);
      } else openProduct(p.id, { Talle: quick.dataset.quick });
      return;
    }
    if (t.closest('.card__quick, .reel__lock, .reel select')) {
      if (t.closest('[data-lock]')) {
        const i = +t.closest('[data-reel]').dataset.reel;
        const r = look.reels[i];
        r.locked = !r.locked;
        t.closest('[data-lock]').classList.toggle('is-locked', r.locked);
        t.closest('[data-lock]').textContent = r.locked ? 'Fijado ✓' : 'Fijar';
      }
      return;
    }

    const open = t.closest('[data-open]');
    if (open) {
      e.preventDefault();
      if ($('#search').classList.contains('is-open')) toggleLayer('#search', false);
      openProduct(open.dataset.open);
      return;
    }

    if (t.closest('[data-open-cart]') || t.closest('#openCart')) {
      closeAll();
      toggleLayer('#cartDrawer', true);
      return;
    }
    if (t.closest('[data-close]')) {
      closeAll();
      return;
    }

    const chip = t.closest('[data-chip]');
    if (chip) return setFilter({ cat: chip.dataset.chip, query: '' }, false);

    const cat = t.closest('[data-cat]');
    if (cat) {
      e.preventDefault();
      return setFilter({ cat: cat.dataset.cat, query: '', sale: false });
    }

    const camp = t.closest('[data-campaign]');
    if (camp) {
      const c = CAMPAIGNS[+camp.dataset.campaign];
      return setFilter({ cat: c.category || 'all', query: c.query || '', sale: false });
    }

    const opt = t.closest('[data-opt]');
    if (opt) {
      const i = +opt.dataset.opt;
      pdp.selected[i] = opt.dataset.val;
      // si la combinación quedó imposible, limpiar las otras opciones no disponibles
      pdp.product.options.forEach((_, k) => {
        if (k !== i && pdp.selected[k] && !S.availableValues(pdp.product, k, pdp.selected).has(pdp.selected[k])) pdp.selected[k] = null;
      });
      return renderPDP();
    }
    if (t.closest('#pdpAdd')) {
      const v = S.findVariant(pdp.product, pdp.selected);
      if (v?.available) {
        added(pdp.product.id, v.id);
        closeAll();
        setTimeout(() => toggleLayer('#cartDrawer', true), 450);
      }
      return;
    }

    const q = t.closest('[data-qty]');
    if (q) {
      const line = S.getCart().find((l) => String(l.variantId) === q.dataset.qty);
      return S.setQty(line.variantId, line.qty + +q.dataset.d);
    }
    const rm = t.closest('[data-remove]');
    if (rm) return S.removeLine(+rm.dataset.remove);

    const step = t.closest('[data-step]');
    if (step) {
      const i = +step.closest('[data-reel]').dataset.reel;
      look.reels[i].locked = false;
      $(`[data-reel="${i}"] [data-lock]`).classList.remove('is-locked');
      $(`[data-reel="${i}"] [data-lock]`).textContent = 'Fijar';
      return spinReel(i, +step.dataset.step);
    }

    const hint = t.closest('[data-hint]');
    if (hint) {
      $('#searchInput').value = hint.dataset.hint;
      return renderSearch();
    }
  });

  $('#reels').addEventListener('change', (e) => {
    if (e.target.tagName !== 'SELECT') return;
    const i = +e.target.closest('[data-reel]').dataset.reel;
    look.reels[i].variantId = e.target.value ? +e.target.value : null;
    e.target.style.borderColor = '';
  });

  $('#shuffle').addEventListener('click', shuffleLook);
  $('#addLook').addEventListener('click', addLook);
  $('#loadMore').addEventListener('click', appendMore);
  $('#onlySale').addEventListener('change', (e) => setFilter({ sale: e.target.checked }, false));
  $('#sort').addEventListener('change', (e) => setFilter({ sort: e.target.value }, false));
  $('#openSearch').addEventListener('click', openSearch);
  $('#searchInput').addEventListener('input', renderSearch);
  $('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const query = e.target.value.trim();
      closeAll();
      setFilter({ cat: 'all', query, sale: false });
    }
  });
  $('#openMenu').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $('#newsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.reset();
    toast('<span>✦ ¡Listo! Te avisamos con la próxima colección.</span>');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
  });
}
