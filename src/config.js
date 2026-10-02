// Datos editables de la tienda. Todo lo comercial (umbral de envío, descuentos, contacto)
// vive acá para que cambiarlo no requiera tocar el resto del código.
export const STORE = {
  name: 'Sur La Côte',
  tagline: 'La elegancia de ser diferente',
  description: 'Indumentaria masculina con estilo europeo.',
  currency: 'ARS',
  freeShippingFrom: 199000,
  transferDiscount: 0.1, // descuento por transferencia que muestra hoy cada producto
  installments: [3, 6], // cuotas sin interés
  whatsapp: '5493415142841',
  email: '',
  instagram: 'https://instagram.com/surlacotearg',
  facebook: 'https://www.facebook.com/surlacoteargentina',
  announcements: [
    '3 y 6 cuotas sin interés',
    'Envío gratis en compras desde $199.000',
    '20% OFF extra pagando por transferencia',
    'Nouvelle collection · Printemps Été 2026',
    'Cambios sin cargo en nuestros locales',
  ],
  stores: [
    {
      name: 'Pellegrini',
      address: 'Av. Pellegrini 911',
      city: 'Rosario, Santa Fe',
      maps: 'https://maps.google.com/?q=Av.+Pellegrini+911,+Rosario',
    },
    {
      name: 'Shopping del Siglo',
      address: 'Local 018 · Planta baja',
      city: 'Rosario, Santa Fe',
      maps: 'https://maps.google.com/?q=Shopping+del+Siglo,+Rosario',
    },
  ],
};

export const CAMPAIGNS = [
  {
    kicker: 'Colección de',
    title: 'Camisas',
    text: 'Lino y pima peruano para los días largos. Rayas finas, cuadros y lisos que respiran.',
    image: import.meta.env.BASE_URL + 'img/campaign-camisas.webp',
    focus: '72%',
    category: 'camisas',
  },
  {
    kicker: 'Colección de',
    title: 'Pantalones',
    text: 'Chinos de gabardina, lino pijamero y cinco bolsillos. El punto de partida de todo look.',
    image: import.meta.env.BASE_URL + 'img/campaign-pantalones.webp',
    focus: '85%',
    category: 'pantalones',
  },
  {
    kicker: 'Nouvelle collection',
    title: 'Lino',
    text: 'Del puerto al almuerzo largo. Camisas, pijameros y chinos de lino para el verano 2026.',
    image: import.meta.env.BASE_URL + 'img/campaign-puerto.webp',
    focus: '98%',
    query: 'lino',
  },
];

// Qué categorías alimenta cada carril del armador de looks
export const LOOK_REELS = [
  { id: 'top', label: 'Arriba', categories: ['camisas', 'chombas', 'remeras', 'sueteres'] },
  { id: 'bottom', label: 'Abajo', categories: ['pantalones', 'denim'] },
  { id: 'extra', label: 'El detalle', categories: ['accesorios', 'calzado', 'abrigos'] },
];

// Paleta aproximada para dibujar los swatches de color
export const SWATCHES = {
  camel: '#c19a6b', azul: '#23407a', crudo: '#efe6d2', verde: '#3f6b4a', negro: '#141414', natural: '#e8dcc4',
  marron: '#5c3a21', 'verde oscuro': '#22402d', 'azul marino': '#14213d', chocolate: '#4a2c1a', gris: '#9a9a9a',
  tostado: '#a8774a', rosa: '#f1b8c0', bordo: '#6d1a2a', amarillo: '#f2cf4a', rojo: '#c8202f', 'gris perla': '#cfcfcb',
  azulino: '#4c6fc4', francia: '#2a52be', blanco: '#fafafa', blanca: '#fafafa', celeste: '#9cc8ea', hueso: '#ece3d0',
  'gris topo': '#7a6e64', coral: '#f0806a', lila: '#b9a3d6', naranja: '#ec7a2c', 'gris medio': '#8a8a8a',
  'azul francia': '#2a52be', 'gris oscuro': '#4a4a4a', 'verde militar': '#4b5320', 'verde agua': '#86cdb8',
  turquesa: '#2bb3b1', 'turquesa / celeste': '#5cc0d0', mostaza: '#d4a017', fuccia: '#d6337f', fucsia: '#d6337f',
  'negro-verde': 'linear-gradient(135deg,#141414 50%,#22402d 50%)', mandarina: '#f58a3c',
};
