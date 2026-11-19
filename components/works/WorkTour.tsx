'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Work } from '@/data/works';
import { asset } from '@/lib/asset';
import { useReducedMotion } from '@/lib/useMedia';
import { useRetype } from '@/lib/useRetype';

const HOLD_MS = 5200; // сколько точка стоит на экране
const FOCUS = 0.44; // на какой доле высоты экрана оказывается точка

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * «Разбор»: вместо живого сайта показывается длинный скриншот страницы.
 * Он сам проезжает к трём точкам, синий курсор встаёт на каждую, рядом набирается пометка.
 * Скриншот двигается через transform: прокруткой чужого iframe управлять нельзя.
 */
export function WorkTour({ work }: { work: Work }) {
  const reduced = useReducedMotion();
  const points = work.tour;
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const [side, setSide] = useState<'right' | 'left'>('right');
  const [arrived, setArrived] = useState(false);

  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const cursor = useRef<HTMLDivElement>(null);

  const point = points[Math.min(i, points.length - 1)];
  const { shown } = useRetype(arrived ? point.text : '', { stepMs: 20, instant: reduced, initial: '' });

  /* Проезд скриншота и курсора к точке */
  const go = useCallback(
    (index: number, instant = false) => {
      const frame = box.current;
      const shot = img.current;
      const cur = cursor.current;
      if (!frame || !shot || !cur || !shot.naturalWidth) return;
      const p = points[index];
      const fw = frame.clientWidth;
      const fh = frame.clientHeight;
      const ih = shot.offsetHeight;
      const py = (p.y / 100) * ih;
      const ty = Math.min(0, Math.max(fh - ih, fh * FOCUS - py));
      const cx = (p.x / 100) * fw;
      const cy = py + ty;

      setSide(p.x > 58 ? 'left' : 'right');
      setArrived(false);
      const done = () => setArrived(true);
      if (instant || reduced) {
        gsap.set(shot, { y: ty });
        gsap.set(cur, { x: cx, y: cy });
        done();
        return;
      }
      gsap.to(shot, { y: ty, duration: 1.15, ease: 'power2.inOut', overwrite: true });
      gsap.to(cur, { x: cx, y: cy, duration: 1.15, ease: 'power2.inOut', overwrite: true, onComplete: done });
    },
    [points, reduced],
  );

  /* Новая работа начинается с первой точки */
  useEffect(() => {
    setI(0);
    setReady(false);
    setArrived(false);
  }, [work.id]);

  useEffect(() => {
    if (ready) go(i);
  }, [i, ready, go]);

  /* Точки сменяются сами; при «меньше движения» только по нажатию */
  useEffect(() => {
    if (!ready || reduced) return;
    const id = window.setTimeout(() => setI((n) => (n + 1) % points.length), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [i, ready, reduced, points.length]);

  /* При изменении размера окна точка остаётся на месте */
  useEffect(() => {
    const frame = box.current;
    if (!frame) return;
    const ro = new ResizeObserver(() => go(i, true));
    ro.observe(frame);
    return () => ro.disconnect();
  }, [go, i]);

  if (!points.length) return null;

  return (
    <div ref={box} className="wt" data-ready={ready}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        key={work.id}
        className="wt-shot"
        src={asset(work.long)}
        alt={`Страница ${work.title} целиком`}
        draggable={false}
        onLoad={() => setReady(true)}
      />

      <div ref={cursor} className="wt-cursor" data-side={side}>
        <span className="wt-bar blink" aria-hidden="true" />
        <div className="wt-note" data-on={arrived} aria-live="polite">
          <span className="wt-count">
            {pad(i + 1)} / {pad(points.length)}
          </span>
          <p>{shown}</p>
        </div>
      </div>

      <div className="wt-dots" role="group" aria-label="Точки разбора">
        {points.map((p, k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === i}
            aria-label={`Точка ${k + 1}: ${p.text}`}
            data-cursor="none"
            onClick={() => setI(k)}
          />
        ))}
      </div>
    </div>
  );
}
