'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Work } from '@/data/works';
import { asset } from '@/lib/asset';
import { useFinePointer, useReducedMotion } from '@/lib/useMedia';

export const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups';

const pad = (n: number) => String(n).padStart(2, '0');

type Props = {
  work: Work;
  /** Номер работы в общем списке, с единицы. */
  n: number;
  total: number;
  onOpen: (id: string) => void;
};

/** Карточка работы в сетке: рамка окна браузера с заставкой, под ней счётчик, название, ниша и теги. */
export function WorkCard({ work, n, total, onOpen }: Props) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const tilt = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  /* 3D-наклон рамки за курсором */
  useEffect(() => {
    const host = tilt.current;
    const target = frame.current;
    if (!host || !target || !fine || reduced) return;

    gsap.set(target, { transformPerspective: 1200 });
    const rx = gsap.quickTo(target, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(target, 'rotationY', { duration: 0.5, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = host.getBoundingClientRect();
      rx(-((e.clientY - r.top) / r.height - 0.5) * 5);
      ry(((e.clientX - r.left) / r.width - 0.5) * 7);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
    };
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(target);
      gsap.set(target, { clearProps: 'transform' });
    };
  }, [fine, reduced]);

  return (
    <article id={`work-${work.id}`} className="wk-card" data-size="md">
      <div ref={tilt} className="wk-tilt">
        <div ref={frame} className="wk-frame" data-work-frame={work.id}>
          <div className="wk-chrome" aria-hidden="true">
            <span className="wk-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="wk-address">{work.title}</span>
          </div>
          <div className="wk-screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="wk-cover"
              src={asset(work.cover)}
              alt=""
              width={960}
              height={1600}
              loading="lazy"
              draggable={false}
              onLoad={(e) => {
                // на сколько заставка может уехать вверх, не открыв пустоту (рамка 16:10)
                const im = e.currentTarget;
                const pan = Math.max(0, 1 - (im.naturalWidth * 0.625) / im.naturalHeight);
                im.style.setProperty('--pan', `${(-pan * 100).toFixed(2)}%`);
              }}
            />
          </div>
          <button
            type="button"
            className="wk-open"
            data-cursor="demo"
            aria-label={`${work.title}. ${work.niche}. Открыть демо`}
            onClick={() => onOpen(work.id)}
          />
        </div>
      </div>

      <div className="wk-meta">
        <span className="wk-count">
          {pad(n)} / {pad(total)}
        </span>
        <div>
          <h3 className="wk-title">{work.title}</h3>
          <p className="wk-niche">{work.niche}</p>
        </div>
        <ul className="wk-tags">
          {work.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
