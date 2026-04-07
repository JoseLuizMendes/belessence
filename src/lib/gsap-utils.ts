/**
 * Belessence GSAP Utilities
 * Animações reutilizáveis centralizadas.
 * Todos os componentes importam daqui — nunca animam diretamente.
 *
 * Regras:
 * - useGSAP obrigatório em componentes React (auto-cleanup)
 * - prefers-reduced-motion sempre verificado
 * - ScrollTrigger integrado via requestAnimationFrame com Lenis
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from '@/lib/design-tokens';

// Registrar plugins uma vez
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── MEDIA QUERY HELPER ───────────────────────────────────────────────────────

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Retorna duration 0 se reduced-motion, senão o valor passado */
export function safeDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/** Retorna stagger 0 se reduced-motion, senão o valor passado */
export function safeStagger(stagger: number): number {
  return prefersReducedMotion() ? 0 : stagger;
}

// ─── FADE IN UP ───────────────────────────────────────────────────────────────

/** Anima elementos de baixo para cima com fade */
export function fadeInUp(
  targets: gsap.TweenTarget,
  options: {
    y?: number;
    duration?: number;
    delay?: number;
    stagger?: number;
    ease?: string;
  } = {}
): gsap.core.Tween {
  const {
    y = 40,
    duration = motion.duration.slow,
    delay = 0,
    stagger = 0,
    ease = motion.ease.luxury,
  } = options;

  return gsap.from(targets, {
    opacity: 0,
    y,
    duration: safeDuration(duration),
    delay,
    stagger: safeStagger(stagger),
    ease,
    clearProps: 'opacity,transform',
  });
}

// ─── FADE IN ──────────────────────────────────────────────────────────────────

export function fadeIn(
  targets: gsap.TweenTarget,
  options: { duration?: number; delay?: number } = {}
): gsap.core.Tween {
  return gsap.from(targets, {
    opacity: 0,
    duration: safeDuration(options.duration ?? motion.duration.normal),
    delay: options.delay ?? 0,
    ease: motion.ease.out,
  });
}

// ─── STAGGER IN ───────────────────────────────────────────────────────────────

/** Stagger de entrada para listas de cards/itens */
export function staggerIn(
  targets: gsap.TweenTarget,
  options: {
    y?: number;
    duration?: number;
    stagger?: number;
    delay?: number;
    ease?: string;
  } = {}
): gsap.core.Tween {
  return gsap.from(targets, {
    opacity: 0,
    y: options.y ?? 30,
    duration: safeDuration(options.duration ?? motion.duration.normal),
    stagger: safeStagger(options.stagger ?? motion.stagger.normal),
    delay: options.delay ?? 0,
    ease: options.ease ?? motion.ease.out,
    clearProps: 'opacity,transform',
  });
}

// ─── HERO CINEMATIC ───────────────────────────────────────────────────────────

/** Animação cinematográfica para hero — timeline com sequência de entradas */
export function heroTimeline(elements: {
  eyebrow?: Element | null;
  title?: Element | null;
  titleSpan?: Element | null;
  subtitle?: Element | null;
  ctas?: Element | null;
}): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: motion.ease.luxury } });
  const d = safeDuration(1);

  if (prefersReducedMotion()) {
    gsap.set([elements.eyebrow, elements.title, elements.titleSpan, elements.subtitle, elements.ctas], {
      opacity: 1,
      y: 0,
    });
    return tl;
  }

  gsap.set([elements.eyebrow, elements.title, elements.titleSpan, elements.subtitle, elements.ctas], {
    opacity: 0,
    y: 30,
  });

  if (elements.eyebrow) tl.to(elements.eyebrow,  { opacity: 1, y: 0, duration: d * 0.7 }, 0.1);
  if (elements.title)   tl.to(elements.title,    { opacity: 1, y: 0, duration: d * 0.9 }, 0.3);
  if (elements.titleSpan) tl.to(elements.titleSpan, { opacity: 1, y: 0, duration: d * 0.9 }, 0.5);
  if (elements.subtitle) tl.to(elements.subtitle, { opacity: 1, y: 0, duration: d * 0.7 }, 0.6);
  if (elements.ctas)    tl.to(elements.ctas,     { opacity: 1, y: 0, duration: d * 0.6 }, 0.75);

  return tl;
}

// ─── SCROLL TRIGGER FADE IN ───────────────────────────────────────────────────

/** Aplica fade-in ativado por scroll em um elemento/seção */
export function scrollFadeIn(
  trigger: Element,
  target: gsap.TweenTarget,
  options: {
    y?: number;
    duration?: number;
    start?: string;
    stagger?: number;
  } = {}
): ScrollTrigger {
  const animation = gsap.from(target, {
    opacity: 0,
    y: options.y ?? 40,
    duration: safeDuration(options.duration ?? motion.duration.slow),
    stagger: safeStagger(options.stagger ?? 0),
    ease: motion.ease.luxury,
    paused: true,
    clearProps: 'opacity,transform',
  });

  return ScrollTrigger.create({
    trigger,
    start: options.start ?? 'top 80%',
    onEnter: () => animation.play(),
    onEnterBack: () => animation.restart(),
  });
}

// ─── CARD HOVER ───────────────────────────────────────────────────────────────

/** Microinteração de hover para cards de produto */
export function cardHoverIn(card: Element): void {
  if (prefersReducedMotion()) return;
  gsap.to(card, {
    y: -6,
    scale: 1.02,
    duration: motion.duration.fast,
    ease: motion.ease.out,
  });
}

export function cardHoverOut(card: Element): void {
  if (prefersReducedMotion()) return;
  gsap.to(card, {
    y: 0,
    scale: 1,
    duration: motion.duration.fast,
    ease: motion.ease.out,
  });
}

// ─── HEADER BLUR SCROLL ───────────────────────────────────────────────────────

/**
 * Progressivamente aumenta o blur e opacidade do header ao scrollar.
 * Chame no componente Header com useGSAP.
 */
export function initHeaderScroll(header: Element): ScrollTrigger {
  return ScrollTrigger.create({
    start: 'top top',
    end: '+=120',
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress;
      gsap.set(header, {
        '--header-bg-opacity': 0.6 + progress * 0.35,
        '--header-blur':       `${8 + progress * 12}px`,
      });
    },
  });
}

// ─── CART BADGE PULSE ─────────────────────────────────────────────────────────

export function cartBadgePulse(badge: Element): void {
  if (prefersReducedMotion()) return;
  gsap.fromTo(
    badge,
    { scale: 1 },
    {
      scale: 1.35,
      duration: 0.15,
      ease: motion.ease.back,
      yoyo: true,
      repeat: 1,
    }
  );
}
