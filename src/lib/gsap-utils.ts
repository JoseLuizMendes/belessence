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

/**
 * Stagger de entrada para listas de cards/itens.
 *
 * Usa `fromTo` (não `from`) + `immediateRender:false` para garantir que o
 * estado final seja sempre visível — mesmo que a animação não dispare por
 * algum motivo (hot-reload, hidratação fora de ordem, etc.).
 */
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
  return gsap.fromTo(
    targets,
    { opacity: 0, y: options.y ?? 30 },
    {
      opacity: 1,
      y: 0,
      duration: safeDuration(options.duration ?? motion.duration.normal),
      stagger: safeStagger(options.stagger ?? motion.stagger.normal),
      delay: options.delay ?? 0,
      ease: options.ease ?? motion.ease.out,
      immediateRender: false,
      clearProps: 'opacity,transform',
    }
  );
}

// ─── SCROLL REVEAL (bidirecional) ─────────────────────────────────────────────

/**
 * Reveal disparado por scroll que **reverte ao subir** (play/reverse).
 * Mobile-first: nada de hover. Não usa clearProps (precisa manter o estado
 * inline para o reverse funcionar). Fallback reduced-motion = estado final.
 */
export function scrollReveal(
  targets: gsap.TweenTarget,
  options: {
    trigger?: Element | null;
    y?: number;
    duration?: number;
    stagger?: number;
    start?: string;
    ease?: string;
  } = {}
): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, filter: 'blur(0px)' });
    return null;
  }

  return gsap.fromTo(
    targets,
    { opacity: 0, y: options.y ?? 28, filter: 'blur(8px)' },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: options.duration ?? motion.duration.slow,
      stagger: options.stagger ?? 0,
      ease: options.ease ?? motion.ease.luxury,
      immediateRender: false,
      scrollTrigger: {
        trigger: options.trigger ?? undefined,
        start: options.start ?? 'top 85%',
        toggleActions: 'play none none reverse',
      },
    }
  );
}

// ─── BLUR REVEAL (texto estilo Boty: blur + sobe) ─────────────────────────────

/**
 * Revelação de texto "blur fade-up" — assinatura do site de inspiração (Boty).
 * O texto entra levemente desfocado e subindo, foca ao entrar na viewport.
 * Roda uma vez (não reverte) para um acabamento premium, sem flicker.
 * Fallback reduced-motion = estado final. **Não usar em elementos que contêm
 * `next/image`** (transform+blur faz a imagem sumir sob Lenis).
 */
export function blurReveal(
  targets: gsap.TweenTarget,
  options: {
    trigger?: Element | null;
    y?: number;
    blur?: number;
    duration?: number;
    stagger?: number;
    start?: string;
    ease?: string;
  } = {}
): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, filter: 'blur(0px)' });
    return null;
  }

  return gsap.fromTo(
    targets,
    { opacity: 0, y: options.y ?? 18, filter: `blur(${options.blur ?? 10}px)` },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: options.duration ?? motion.duration.slow,
      stagger: options.stagger ?? 0,
      ease: options.ease ?? motion.ease.luxury,
      immediateRender: false,
      scrollTrigger: {
        trigger: options.trigger ?? (targets as Element),
        start: options.start ?? 'top 85%',
        toggleActions: 'play none none none',
      },
    }
  );
}

// ─── PARALLAX (scrub via Lenis) ───────────────────────────────────────────────

/**
 * Parallax vertical contínuo (scrub) — efeito high-ticket característico.
 * O alvo deve ser um wrapper com folga (ex.: `top-[-8%] h-[116%]`) dentro de
 * um container `overflow-hidden`, para o movimento não revelar bordas.
 */
export function parallaxY(
  target: gsap.TweenTarget,
  options: {
    trigger?: Element | null;
    from?: number;
    to?: number;
  } = {}
): gsap.core.Tween | null {
  if (prefersReducedMotion()) return null;

  return gsap.fromTo(
    target,
    { yPercent: options.from ?? -8 },
    {
      yPercent: options.to ?? 8,
      ease: 'none',
      scrollTrigger: {
        trigger: (options.trigger as Element) ?? (target as Element),
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    }
  );
}

// ─── IMAGE CURTAIN REVEAL (clip-path, uma vez) ────────────────────────────────

/**
 * Reveal de imagem por "cortina" via clip-path (não transform).
 * Usar em <Image> sob Lenis: parallax/transform contínuo faz a camada do
 * Next/Image não pintar durante o scroll ("imagem some"). clip-path é paint,
 * não composite-transform — pinta normal. Reveal único (não reverte), então a
 * imagem nunca desaparece ao subir.
 */
export function imageCurtainReveal(
  target: Element | null,
  options: { trigger?: Element | null; start?: string; delay?: number; duration?: number } = {}
): gsap.core.Tween | null {
  if (!target) return null;
  if (prefersReducedMotion()) {
    gsap.set(target, { clipPath: 'inset(0% 0 0 0)' });
    return null;
  }
  return gsap.fromTo(
    target,
    { clipPath: 'inset(100% 0 0 0)' },
    {
      clipPath: 'inset(0% 0 0 0)',
      duration: options.duration ?? motion.duration.slow,
      delay: options.delay ?? 0,
      ease: motion.ease.luxury,
      immediateRender: false,
      scrollTrigger: {
        trigger: options.trigger ?? target,
        start: options.start ?? 'top 82%',
        toggleActions: 'play none none none',
      },
    }
  );
}

// ─── MASK REVEAL (título por linha/máscara) ───────────────────────────────────

/**
 * Reveal de título estilo editorial: o texto sobe de baixo de uma máscara.
 * Requer que o alvo esteja dentro de um wrapper com `overflow-hidden`.
 * Bidirecional (reverte ao subir).
 */
export function maskRevealTitle(
  target: gsap.TweenTarget,
  options: { trigger?: Element | null; start?: string; duration?: number } = {}
): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    gsap.set(target, { yPercent: 0, opacity: 1 });
    return null;
  }

  return gsap.fromTo(
    target,
    { yPercent: 115, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: options.duration ?? motion.duration.slow,
      ease: motion.ease.luxury,
      immediateRender: false,
      scrollTrigger: {
        trigger: options.trigger ?? (target as Element),
        start: options.start ?? 'top 88%',
        toggleActions: 'play none none reverse',
      },
    }
  );
}

// ─── REVEAL ON SCROLL ─────────────────────────────────────────────────────────

/**
 * Reveal idempotente disparado por ScrollTrigger.
 * - `once:true` → animação roda uma única vez
 * - `immediateRender:false` → não força opacity:0 antes do trigger
 * - Fallback reduced-motion: aplica estado final imediatamente
 */
export function revealOnScroll(
  targets: gsap.TweenTarget,
  options: {
    trigger?: Element | null;
    y?: number;
    duration?: number;
    stagger?: number;
    start?: string;
    ease?: string;
  } = {}
): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' });
    return null;
  }

  const tween = gsap.fromTo(
    targets,
    { opacity: 0, y: options.y ?? 30 },
    {
      opacity: 1,
      y: 0,
      duration: options.duration ?? motion.duration.slow,
      stagger: options.stagger ?? 0,
      ease: options.ease ?? motion.ease.luxury,
      immediateRender: false,
      clearProps: 'opacity,transform',
      scrollTrigger: {
        trigger: options.trigger ?? undefined,
        start: options.start ?? 'top 90%',
        once: true,
        toggleActions: 'play none none none',
      },
    }
  );

  return tween;
}

// ─── REVEAL SECTION (data-reveal variants) ────────────────────────────────────

/**
 * Reveal automático em todos os filhos com `[data-reveal]` dentro de um container.
 * Lê a variante via atributo: `data-reveal="fade-up" | "fade-in" | "scale-in"`.
 */
export function revealSection(container: Element): void {
  if (prefersReducedMotion()) {
    const all = container.querySelectorAll('[data-reveal]');
    all.forEach((el) => gsap.set(el, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', clearProps: 'transform,filter' }));
    return;
  }

  const variants = ['fade-up', 'fade-in', 'scale-in'] as const;
  variants.forEach((variant) => {
    const els = container.querySelectorAll(`[data-reveal="${variant}"]`);
    if (els.length === 0) return;

    const from =
      variant === 'fade-up'
        ? { opacity: 0, y: 24, filter: 'blur(8px)' }
        : variant === 'fade-in'
          ? { opacity: 0, filter: 'blur(8px)' }
          : { opacity: 0, scale: 0.95, filter: 'blur(8px)' };

    gsap.fromTo(
      els,
      from,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: motion.duration.slow,
        ease: motion.ease.luxury,
        stagger: 0.1,
        immediateRender: false,
        clearProps: 'opacity,transform,filter',
        scrollTrigger: {
          trigger: container,
          start: 'top 85%',
          once: true,
          toggleActions: 'play none none none',
        },
      }
    );
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
