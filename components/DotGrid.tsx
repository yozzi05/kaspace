'use client';

import { useEffect, useRef } from 'react';
import { useFinePointer, useReducedMotion } from '@/lib/useMedia';

const STEP = 30; // шаг сетки, px
const RADIUS = 170; // радиус реакции на мышь, px
const PUSH = 12; // на сколько точки отодвигаются от курсора, px

/**
 * Фон из точек, как видимые пробелы в редакторе кода. Под мышью точки
 * загораются синим, становятся крупнее и расступаются. На телефоне и при
 * prefers-reduced-motion сетка статична.
 */
export function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const live = fine && !reduced;
    let dpr = 1;
    let w = 0;
    let h = 0;
    let mx = -9999;
    let my = -9999;
    let t = 0;
    let raf = 0;

    /* Цвета точек берутся из токенов темы и перечитываются при её смене */
    let base = '240,238,232';
    let accent = '61,184,255';
    let boost = 1; // тёмные точки на светлом фоне заметны хуже светлых на тёмном
    const rgb = (name: string, fallback: string) => {
      const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace('#', '');
      if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
      return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');
    };
    const readTheme = () => {
      base = rgb('--color-paper', base);
      accent = rgb('--color-accent', accent);
      boost = document.documentElement.dataset.mode === 'light' ? 1.7 : 1;
    };
    readTheme();
    const themeWatch = new MutationObserver(() => {
      readTheme();
      if (!live) draw();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });

    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);
      const step = STEP * dpr;
      const radius = RADIUS * dpr;
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.hypot(dx, dy);
          let alpha = live ? 0.085 + 0.035 * Math.sin(t + x * 0.004 + y * 0.006) : 0.09;
          let px = x;
          let py = y;
          let r = 1.1 * dpr;
          const near = dist < radius;
          if (near) {
            const k = 1 - dist / radius;
            alpha += 0.75 * k * k;
            px += (dx / (dist || 1)) * PUSH * dpr * k;
            py += (dy / (dist || 1)) * PUSH * dpr * k;
            r += 1.3 * dpr * k;
          }
          ctx.fillStyle = `rgba(${near ? accent : base},${Math.min(1, alpha * boost)})`;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.round(window.innerWidth * dpr);
      h = canvas.height = Math.round(window.innerHeight * dpr);
      if (!live) draw();
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX * dpr;
      my = e.clientY * dpr;
    };
    const onLeave = () => {
      mx = -9999;
      my = -9999;
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (live && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    if (live) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', onVisibility);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      themeWatch.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fine, reduced]);

  return <canvas ref={ref} className="dotgrid" aria-hidden="true" />;
}
