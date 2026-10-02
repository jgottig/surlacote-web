import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export let lenis = null;

export function initSmoothScroll() {
  if (reduced) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    scrollToEl(target);
  });
}

export function scrollToEl(el, offset = -10) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4, force: true });
  else el.scrollIntoView({ behavior: 'smooth' });
}

export function lockScroll(lock) {
  document.body.classList.toggle('is-locked', lock);
  if (!lenis) return;
  lock ? lenis.stop() : lenis.start();
}

/* ---------- Intro ---------- */
export function playIntro() {
  const loader = document.getElementById('loader');
  const tl = gsap.timeline();
  if (reduced) {
    loader.remove();
    return tl;
  }
  tl.to('.loader__word span', { y: 0, duration: 0.9, stagger: 0.04, ease: 'expo.out' })
    .to('.loader__line', { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, '-=0.6')
    .to('.loader__sub', { opacity: 1, duration: 0.4 }, '-=0.3')
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut', delay: 0.25 })
    .set(loader, { display: 'none' })
    .from('.hero__line > span', { yPercent: 110, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '-=0.55')
    .from('#heroArch', { clipPath: 'inset(100% 0 0 0)', duration: 1.3, ease: 'expo.inOut' }, '<-0.1')
    .from('.hero__arch-first', { scale: 1.6, duration: 1.8, ease: 'expo.out' }, '<')
    .from('.hero__cta, .hero__meta', { opacity: 0, y: 20, duration: 0.8, stagger: 0.08 }, '-=1');
  return tl;
}

/* ---------- Hero: el arco se abre hasta ocupar la pantalla ---------- */
export function initHero() {
  if (reduced) return;
  const arch = document.getElementById('heroArch');
  const start = { w: 0, h: 0 };
  const measure = () => {
    gsap.set(arch, { clearProps: 'width,height,borderRadius,aspectRatio' });
    const r = arch.getBoundingClientRect();
    start.w = r.width;
    start.h = r.height;
  };
  measure();
  ScrollTrigger.addEventListener('refreshInit', measure);

  // Desktop: el arco se abre hasta ser el panel derecho y aparece el texto de colección.
  // Mobile: el arco crece y queda protagonista, sin cambiar de foto.
  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, ({ conditions }) => {
    const { desktop } = conditions;
    const mobileW = () => Math.min(innerWidth * 0.88, innerHeight * 0.7 * 0.74);
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: 0.4, invalidateOnRefresh: true },
    });
    tl.fromTo(
      arch,
      { width: () => start.w, height: () => start.h, left: '50%', borderRadius: '999px 999px 0px 0px', aspectRatio: 'auto' },
      {
        width: () => (desktop ? innerWidth / 2 : mobileW()),
        height: () => (desktop ? innerHeight : mobileW() / 0.74),
        left: desktop ? '75%' : '50%',
        top: '50%',
        borderRadius: desktop ? '0px 0px 0px 0px' : '999px 999px 0px 0px',
        ease: 'power2.inOut',
      },
    );
    if (desktop) {
      tl.to('.hero__arch-main', { scale: 1.15, ease: 'none' }, 0).to('.hero__arch-first', { opacity: 0, duration: 0.18, ease: 'none' }, 0.32);
    }
    tl
      .to('.hero__line:nth-child(1)', { xPercent: -40, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0)
      .to('.hero__line--right', { xPercent: 40, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0)
      .to('.hero__line--wide', { scale: 1.6, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0)
      .to('.hero__cta, .hero__meta, .hero__arch-cap', { opacity: 0, duration: 0.3 }, 0);
    if (conditions.desktop) {
      tl.fromTo('#heroReveal', { autoAlpha: 0, y: 40, yPercent: -50 }, { autoAlpha: 1, y: 0, yPercent: -50, duration: 0.35, ease: 'power2.out' }, 0.65);
    }
  });
}

/* ---------- Manifiesto: palabras que se encienden ---------- */
export function initManifesto() {
  const el = document.getElementById('manifesto');
  el.innerHTML = el.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`)
    .join(' ');
  if (reduced) return gsap.set('.manifesto__text .w', { opacity: 1 });
  gsap.to('.manifesto__text .w', {
    opacity: 1,
    stagger: 0.05,
    ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  document.querySelectorAll('[data-count]').forEach((n) => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +n.dataset.count,
      duration: 1.6,
      ease: 'power3.out',
      onUpdate: () => (n.textContent = Math.round(obj.v)),
      scrollTrigger: { trigger: n, start: 'top 90%', once: true },
    });
  });
}

/* ---------- Colecciones: scroll horizontal ---------- */
export function initCampaigns() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    if (reduced) return;
    const track = document.getElementById('campaigns');
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.campaigns__pin',
        pin: true,
        start: 'top top',
        end: () => '+=' + dist(),
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
    gsap.to('#campaignsProgress', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.campaigns__pin', start: 'top top', end: () => '+=' + dist(), scrub: true },
    });
    track.querySelectorAll('.campaign__media img').forEach((im) =>
      gsap.fromTo(im, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: im, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }),
    );
  });
}

/* ---------- Revelado de tarjetas ---------- */
export function revealCards(cards) {
  if (reduced || !cards.length) return;
  cards.forEach((c) => c.classList.add('reveal'));
  ScrollTrigger.batch(cards, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.07,
        ease: 'expo.out',
        onComplete: () => batch.forEach((b) => b.classList.remove('reveal')),
      }),
  });
  ScrollTrigger.refresh();
}

/* ---------- Header que se esconde ---------- */
export function initHeader() {
  const header = document.getElementById('header');
  let last = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    const hide = y > last && y > 400;
    header.classList.toggle('is-hidden', hide);
    document.body.classList.toggle('header-visible', !hide);
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Cursor y botones magnéticos ---------- */
export function initCursor() {
  if (matchMedia('(hover: none)').matches) return;
  const cursor = document.getElementById('cursor');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
    const view = e.target.closest?.('.card__media, .reel__window, .postcard');
    const dark = e.target.closest?.('.look, .campaigns, .footer, .loader');
    cursor.classList.toggle('is-view', !!view && !e.target.closest('.card__quick, .reel__lock'));
    cursor.style.background = dark && !view ? 'var(--chalk)' : '';
  });
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.25);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => (x(0), y(0)));
  });
}

/* ---------- Carril arrastrable ---------- */
export function dragScroll(el) {
  let down = false,
    startX = 0,
    startLeft = 0,
    moved = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true;
    moved = false;
    startX = e.clientX;
    startLeft = el.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) {
      moved = true;
      el.classList.add('is-dragging');
    }
    el.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    down = false;
    el.classList.remove('is-dragging');
  });
  el.addEventListener('click', (e) => moved && (e.stopPropagation(), e.preventDefault()), true);
}

export { gsap, ScrollTrigger };
