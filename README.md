# Sur La Côte — web v0.2

Frontend a medida para Sur La Côte (indumentaria masculina, Rosario), con el catálogo real. Hay dos propuestas de diseño que comparten datos y bolsa:

- **Propuesta A** (`/`): editorial, tipo revista de moda, con animaciones de scroll.
- **Propuesta B** (`/b/`): cálida y directa, con bloques de color, tarjetas redondeadas y **probador virtual**.

## Correr el proyecto

```bash
npm install
npm run dev        # http://localhost:5173
npm run sync       # vuelve a traer productos/precios/stock de la tienda actual (y calcula el color de cada prenda)
npm run build      # genera /dist para publicar
```

## Qué incluye

- **Hero** con arco mediterráneo que se abre al hacer scroll y revela la campaña Printemps Été 2026.
- **Postales** de categorías (carril arrastrable).
- **Colecciones** en scroll horizontal (Camisas, Pantalones, Lino).
- **Tienda** con filtros por categoría, solo ofertas, orden, badges de descuento y de últimas unidades, agregado rápido por talle.
- **Ficha de producto** en panel lateral: galería por color, talles con stock real, cuotas, precio por transferencia y "Completá el look".
- **Armá tu look**: tres carriles tipo tragamonedas (arriba / abajo / detalle) para sumar el conjunto entero a la bolsa.
- **Bolsa** con barra de envío gratis (el velero navega hasta el faro en $199.000).
- Búsqueda con ⌘K / Ctrl+K, WhatsApp flotante, locales y newsletter.

## Probador virtual (propuesta B)

Un figurín ilustrado en SVG al que se le "ponen" las prendas al tocarlas. No usa fotos recortadas: cada prenda se dibuja según su tipo (camisa, chomba, remera, suéter, buzo, campera, chaleco, saco, piloto, pantalón, calzado, cinturón, bufanda), con su color real y su estampado (rayas, cuadros, denim, acolchado).

- El tipo sale de la categoría y el nombre del producto; el color, de la variante elegida o de la foto (`npm run sync` mide los tonos de cada imagen).
- Por eso **un producto nuevo aparece solo en el probador**, sin trabajo extra.
- Código: `src/b/figurin.js` (dibujo) y la sección "Probador" de `src/b/main.js`.

## Estructura

```
index.html               maqueta de la página
src/config.js            datos editables: envío gratis, cuotas, descuentos, contacto, campañas
src/store.js             capa de datos: catálogo + bolsa (único lugar a tocar para cambiar el backend)
src/main.js              interfaz
src/motion.js            animaciones (GSAP + Lenis)
src/styles.css           estilos
src/b/                   propuesta B (main.js, styles.css, figurin.js) — página en b/index.html
scripts/sync-products.mjs  trae el catálogo de surlacoteweb.com → public/data/products.json
public/img/              logo y fotos de campaña
```

## Pendiente para producción

1. **Catálogo por la API oficial de Tiendanube**: reemplazar `sync-products.mjs` (hoy lee el HTML público) por una función serverless que use la API con token, y que se actualice por webhook cuando cambia un producto.
2. **Checkout**: hoy "Finalizar compra" manda el pedido por WhatsApp. En producción se crea un *draft order* por API y se redirige al `checkout_url` de Tiendanube (Mercado Pago, cálculo de envío, facturación).
3. Páginas de Guía de talles, Cambios, Preguntas frecuentes y Mayoristas.
4. Newsletter conectado a un servicio real (hoy sólo muestra la confirmación).
5. Confirmar el descuento por transferencia: el banner dice 20% y los productos muestran 10% (`src/config.js`).
