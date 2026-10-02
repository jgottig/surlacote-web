// Figurín ilustrado + prendas en SVG. Cada producto se dibuja según su tipo (camisa, chomba,
// suéter, campera, pantalón…), su color real y su estampado (rayas, cuadros, denim),
// así cualquier producto nuevo que se cargue aparece en el probador sin trabajo extra.
import { SWATCHES } from '../config.js';
import { colorName } from '../store.js';

/* ---------- Clasificación ---------- */
export function slotFor(p) {
  const t = p.title.toLowerCase();
  if (['camisas', 'chombas', 'remeras'].includes(p.category)) return 'top';
  if (['sueteres', 'buzos', 'abrigos'].includes(p.category)) return 'layer';
  if (['pantalones', 'denim'].includes(p.category)) return 'bottom';
  if (p.category === 'calzado') return 'shoes';
  if (/cintur/.test(t)) return 'belt';
  if (/bufanda/.test(t)) return 'scarf';
  return null;
}

function kindOf(p) {
  const t = p.title.toLowerCase();
  if (p.category === 'camisas') return 'shirt';
  if (p.category === 'chombas') return 'polo';
  if (p.category === 'remeras') return 'tee';
  if (/cardigan|campera (de lana|punto|jersey)|con trenzas/.test(t)) return 'cardigan';
  if (p.category === 'sueteres') return 'sweater';
  if (p.category === 'buzos') return /capucha|canguro/.test(t) ? 'hoodie' : 'sweater';
  if (/chaleco/.test(t)) return 'vest';
  if (/saco/.test(t)) return 'blazer';
  if (/piloto/.test(t)) return 'trench';
  if (p.category === 'abrigos') return 'jacket';
  if (p.category === 'calzado') return /borceg/.test(t) ? 'boot' : 'sneaker';
  return 'other';
}

function patternOf(p) {
  const t = p.title.toLowerCase();
  if (p.category === 'denim' || /jean|denim/.test(t)) return 'denim';
  if (/cuadros/.test(t)) return 'checks';
  if (/raya|rayad/.test(t)) return p.category === 'camisas' ? 'vstripes' : 'hstripes';
  if (/canelon|puffer|parka/.test(t)) return 'quilt';
  return null;
}

const longSleeve = (p, kind) => {
  const t = p.title.toLowerCase();
  if (/m\/c|mangas? cortas?/.test(t)) return false;
  if (/m\/l|mangas? largas?|manga larga/.test(t)) return true;
  return !['polo', 'tee'].includes(kind);
};

/* ---------- Color ---------- */
export function garmentColors(p, colorValue) {
  const variant = colorValue ? p.variants.find((v) => v.options.includes(colorValue)) : null;
  let base = p.tones?.[0] || '#cfc6b8';
  let second = p.tones?.[1] || base;
  if (colorValue) {
    const sw = SWATCHES[colorName(colorValue).toLowerCase()];
    if (sw && !sw.startsWith('linear')) base = sw;
    else if (variant?.tones) base = variant.tones[0];
    if (variant?.tones && variant.tones[1] !== variant.tones[0]) second = variant.tones[1];
  }
  if (second.toLowerCase() === base.toLowerCase()) second = shade(base, -0.25);
  return { base, second };
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
}

/* ---------- Primitivas ---------- */
const STROKE = 'stroke="rgba(20,25,40,.35)" stroke-width="1.2" stroke-linejoin="round"';
const shape = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${STROKE} ${extra}/><path d="${d}" fill="url(#vol)" pointer-events="none"/>`;
const line = (d, color = 'rgba(20,25,40,.35)', w = 1.2, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
// Dibuja el lado izquierdo y lo espeja para el derecho
const both = (svg) => `${svg}<g transform="translate(300 0) scale(-1 1)">${svg}</g>`;

function patternDef(id, kind, base, second) {
  switch (kind) {
    case 'vstripes':
      return `<pattern id="${id}" width="9" height="10" patternUnits="userSpaceOnUse"><rect width="9" height="10" fill="${base}"/><rect width="2" height="10" x="3" fill="${second}" opacity=".75"/></pattern>`;
    case 'hstripes':
      return `<pattern id="${id}" width="10" height="14" patternUnits="userSpaceOnUse"><rect width="10" height="14" fill="${base}"/><rect width="10" height="5" fill="${second}"/></pattern>`;
    case 'checks':
      return `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${base}"/><rect width="16" height="5" fill="${second}" opacity=".45"/><rect width="5" height="16" fill="${second}" opacity=".45"/></pattern>`;
    case 'denim':
      return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="${base}"/><rect width="2" height="6" fill="${shade(base, 0.12)}" opacity=".7"/></pattern>`;
    default:
      return '';
  }
}

/* ---------- Cuerpo ---------- */
const SKIN = '#e2b896';
export function figureSVG(inner = '') {
  const arm = `<path d="M100,122 Q86,127 84,146 L72,334 Q70,352 73,370 L86,372 L90,340 L104,180 Z" fill="${SKIN}" ${STROKE}/><ellipse cx="80" cy="384" rx="8" ry="14" fill="${SKIN}" ${STROKE}/>`;
  return `
<svg class="figurin" viewBox="0 0 300 760" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Figurín con el look elegido">
  <defs>
    <linearGradient id="vol" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".2"/>
      <stop offset=".28" stop-color="#000" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".1"/>
      <stop offset=".72" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".2"/>
    </linearGradient>
    <radialGradient id="floor"><stop offset="0" stop-color="#13223f" stop-opacity=".22"/><stop offset="1" stop-color="#13223f" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="150" cy="734" rx="110" ry="16" fill="url(#floor)"/>
  <g class="body">
    ${both(arm)}
    <path d="M98,330 L202,330 L200,420 L192,702 L162,702 L152,440 L148,440 L138,702 L108,702 L100,420 Z" fill="${SKIN}" ${STROKE}/>
    ${both(`<path d="M106,700 L140,700 L143,716 Q143,724 135,724 L104,724 Q98,724 100,716 Z" fill="${SKIN}" ${STROKE}/>`)}
    <path d="M138,106 Q118,112 100,121 Q89,126 87,140 L95,332 Q150,340 205,332 L213,140 Q211,126 200,121 Q182,112 162,106 Z" fill="${SKIN}" ${STROKE}/>
    <path d="M97,326 L203,326 L203,384 L155,384 L150,370 L145,384 L97,384 Z" fill="#c9ced8" ${STROKE}/>
    <path d="M140,82 L160,82 L162,110 Q150,116 138,110 Z" fill="${SKIN}" ${STROKE}/>
    <ellipse cx="150" cy="56" rx="25" ry="31" fill="${SKIN}" ${STROKE}/>
    <path d="M124,54 Q120,20 150,19 Q181,20 177,54 Q172,34 150,33 Q131,34 124,54 Z" fill="#3b2a20"/>
  </g>
  <g class="garments">${inner}</g>
</svg>`;
}

/* ---------- Prendas ---------- */
const torso = (hem, x0 = 87, x1 = 213) =>
  `M136,103 Q116,111 100,120 Q${x0 + 2},125 ${x0},140 L${x0 + 7},${hem} Q150,${hem + 7} ${x1 - 7},${hem} L${x1},140 Q${x1 - 2},125 200,120 Q184,111 164,103 Q150,116 136,103 Z`;
const sleeveLong = (w = 0) => `M100,120 Q${86 - w},125 ${84 - w},145 L${69 - w},352 L${91 + w * 0.3},356 L104,178 Z`;
const sleeveShort = `M100,120 Q86,125 84,145 L78,214 L102,220 L104,170 Z`;

function drawTop(p, kind, fill, c, { tucked }) {
  const hem = tucked ? 330 : 352;
  const long = longSleeve(p, kind);
  let out = both(shape(long ? sleeveLong() : sleeveShort, fill)) + shape(torso(hem), fill);
  if (kind === 'shirt') {
    out += both(shape('M136,103 L150,134 L128,129 L127,108 Z', fill));
    out += line(`M150,134 L150,${hem + 4}`);
    for (let y = 152; y < hem; y += 34) out += `<circle cx="150" cy="${y}" r="2" fill="${shade(c.base, -0.35)}"/>`;
    if (long) out += both(line('M71,340 L90,343'));
  } else if (kind === 'polo') {
    out += both(shape('M137,103 Q150,111 163,103 L169,116 L155,124 L150,117 Z', fill));
    out += shape('M146,116 L154,116 L154,166 L146,166 Z', fill);
    out += `<circle cx="150" cy="130" r="1.8" fill="${shade(c.base, -0.4)}"/><circle cx="150" cy="150" r="1.8" fill="${shade(c.base, -0.4)}"/>`;
    out += `<rect x="168" y="150" width="9" height="5" rx="1" fill="#1f4fbf"/><rect x="177" y="150" width="5" height="5" fill="#d7263d"/>`;
    out += both(line(long ? 'M71,342 L90,345' : 'M79,206 L101,212', shade(c.base, -0.3), 3));
  } else if (kind === 'tee') {
    out += line('M136,103 Q150,121 164,103', shade(c.base, -0.25), 4);
  }
  return out;
}

function drawLayer(p, kind, fill, c, ctx) {
  const t = p.title.toLowerCase();
  const dark = shade(c.base, -0.3);
  if (kind === 'sweater' || kind === 'hoodie') {
    const hem = kind === 'hoodie' ? 356 : 350;
    let out = '';
    
    out += both(shape(sleeveLong(2), fill) + line('M69,338 L92,342', dark, 5));
    const vneck = /escote (en )?v/.test(t);
    out += vneck
      ? shape(`${torso(hem, 85, 215)} M137,104 L150,152 L163,104 Z`, fill, 'fill-rule="evenodd"') + line('M137,104 L150,152 L163,104', dark, 3)
      : shape(torso(hem, 85, 215), fill) + line('M136,103 Q150,118 164,103', dark, 4);
    if (/medio cierre/.test(t)) out += shape('M138,96 L162,96 L163,110 L137,110 Z', fill) + line('M150,96 L150,170', '#c9c9c9', 2);
    out += line(`M93,${hem - 8} Q150,${hem - 1} 207,${hem - 8}`, dark, 5);
    if (kind === 'hoodie' && /capucha/.test(t)) out += shape('M118,108 Q150,86 182,108 Q176,126 150,128 Q124,126 118,108 Z', shade(c.base, -0.1)) + line('M132,112 Q150,122 168,112', dark, 1.4) + line('M144,124 L142,168 M156,124 L158,168', '#f2efe9', 1.6);
    if (kind === 'hoodie' && /canguro/.test(t)) out += shape(`M112,280 L188,280 L194,${hem - 12} L106,${hem - 12} Z`, fill);
    return out;
  }
  if (kind === 'cardigan') {
    const hem = 356;
    let out = both(shape(sleeveLong(2), fill) + line('M69,338 L92,342', dark, 5));
    out += both(shape(`M136,103 Q116,111 100,120 Q87,125 85,140 L92,${hem} Q120,${hem + 5} 146,${hem + 2} L146,160 Z`, fill));
    for (let y = 175; y < hem; y += 40) out += `<circle cx="141" cy="${y}" r="2.4" fill="${dark}"/>`;
    return out;
  }
  if (kind === 'vest') {
    const hem = 352;
    let out = both(shape(`M128,102 L106,126 Q112,150 110,190 L94,196 L97,${hem} Q122,${hem + 6} 149,${hem + 4} L149,118 Q142,104 128,102 Z`, fill));
    out += line(`M150,110 L150,${hem + 4}`, '#bdbdbd', 1.6);
    if (ctx.pattern === 'quilt') for (let y = 150; y < hem; y += 32) out += line(`M98,${y} Q150,${y + 5} 202,${y}`, dark, 1.2);
    return out;
  }
  // Camperas, sacos y pilotos
  const hem = kind === 'trench' ? 520 : kind === 'blazer' ? 372 : 364;
  let out = both(shape(sleeveLong(5), fill) + line('M64,336 L93,341', dark, 4));
  if (kind === 'blazer' || kind === 'trench') {
    out += both(shape(`M134,101 Q113,110 97,120 Q84,126 82,141 L88,${hem} Q118,${hem + 6} 150,${hem + 4} L150,212 L134,101 Z`, fill));
    out += both(shape('M134,101 L150,212 L128,170 L122,128 Z', shade(c.base, -0.12)));
    const buttons = kind === 'trench' ? [250, 290, 330] : [238, 270];
    buttons.forEach((y) => (out += `<circle cx="144" cy="${y}" r="2.6" fill="${dark}"/>`));
    if (kind === 'trench') out += shape('M84,318 L216,318 L216,332 L84,332 Z', shade(c.base, -0.08)) + `<rect x="142" y="316" width="16" height="18" rx="2" fill="none" stroke="${dark}" stroke-width="2"/>`;
    return out;
  }
  out += shape(torso(hem, 82, 218), fill);
  out += shape('M134,92 L166,92 L168,112 Q150,118 132,112 Z', fill);
  out += line(`M150,100 L150,${hem + 5}`, '#cfcfcf', 2);
  if (ctx.pattern === 'quilt') for (let y = 150; y < hem; y += 30) out += line(`M90,${y} Q150,${y + 6} 210,${y}`, dark, 1.2) + both(line(`M${86 - (y - 150) * 0.07},${y} L101,${y + 2}`, dark, 1));
  if (/cuero/.test(t)) out += `<path d="${torso(hem, 82, 218)}" fill="#fff" opacity=".06"/>`;
  return out;
}

function drawBottom(p, kind, fill, c) {
  const dark = shade(c.base, -0.3);
  const t = p.title.toLowerCase();
  let out = shape('M96,322 L204,322 L203,426 L195,707 L160,707 L152,446 L148,446 L140,707 L105,707 L97,426 Z', fill);
  out += line('M150,330 L150,402', dark) + both(line('M107,334 Q120,348 122,372', dark));
  if (p.category === 'denim' || /5 bolsillos/.test(t)) out += line('M96,334 L204,334', '#d39b4a', 1, 'stroke-dasharray="3 3"');
  if (/pijamero/.test(t)) out += line('M146,332 Q140,350 136,360 M154,332 Q160,350 164,360', '#f3efe6', 1.6);
  return out;
}

function drawShoes(p, kind, fill, c) {
  const sole = kind === 'boot' ? shade(c.base, -0.55) : '#f4f1ea';
  const shoe =
    kind === 'boot'
      ? shape('M107,676 L140,676 L141,703 L148,715 Q149,728 138,728 L104,728 Q97,728 100,716 Z', fill) + line('M114,684 L134,684 M114,692 L134,692 M114,700 L136,700', '#e8dccb', 1.2)
      : shape('M106,700 L140,700 L147,714 Q149,726 138,726 L104,726 Q97,726 100,716 Z', fill) + line('M114,706 L134,706', '#fff', 1.2);
  return both(shoe + `<path d="M99,722 L148,722 L148,729 L101,729 Z" fill="${sole}"/>`);
}

function drawBelt(p, kind, fill) {
  return shape('M96,321 L204,321 L204,334 L96,334 Z', fill) + '<rect x="141" y="319" width="18" height="17" rx="2" fill="none" stroke="#c8c8c8" stroke-width="2.4"/>';
}

function drawScarf(p, kind, fill, c) {
  return (
    shape('M131,96 Q150,114 169,96 L173,113 Q150,134 127,113 Z', fill) +
    shape('M154,116 L170,118 L168,214 L153,210 Z', fill) +
    line('M155,214 L155,222 M159,214 L159,223 M163,215 L163,223 M167,215 L167,223', shade(c.base, -0.2), 1.4)
  );
}

const DRAW = { top: drawTop, layer: drawLayer, bottom: drawBottom, shoes: drawShoes, belt: drawBelt, scarf: drawScarf };

/** Devuelve el SVG de una prenda lista para insertar en el figurín */
export function garmentSVG(slot, p, colorValue, ctx = {}) {
  const kind = kindOf(p);
  const pattern = patternOf(p);
  const c = garmentColors(p, colorValue);
  const id = `pt-${slot}-${p.id}`;
  const def = patternDef(id, pattern, c.base, c.second);
  const fill = def ? `url(#${id})` : c.base;
  return `<g class="g g--${slot}" data-slot="${slot}">${def ? `<defs>${def}</defs>` : ''}${DRAW[slot](p, kind, fill, c, { ...ctx, pattern })}</g>`;
}

export const LAYER_ORDER = ['bottom', 'shoes', 'top', 'belt', 'layer', 'scarf'];
