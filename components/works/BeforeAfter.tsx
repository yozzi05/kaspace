'use client';

import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { Work } from '@/data/works';
import { asset } from '@/lib/asset';

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Шторка «было / стало»: старый сайт лежит поверх нового и обрезается clip-path,
 * вертикальная полоса-курсор перетаскивается мышью, пальцем или стрелками.
 * Показывается только для работ, у которых есть скриншот старого сайта.
 */
export function BeforeAfter({ works }: { works: readonly Work[] }) {
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(50);
  const [missing, setMissing] = useState<readonly string[]>([]);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const list = works.filter((w) => w.before && !missing.includes(w.id));
  if (!list.length) return null;
  const work = list[Math.min(index, list.length - 1)];

  const moveTo = (clientX: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (r) setPos(clamp(((clientX - r.left) / r.width) * 100));
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) moveTo(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 4;
    if (e.key === 'ArrowLeft') setPos((p) => clamp(p - step));
    else if (e.key === 'ArrowRight') setPos((p) => clamp(p + step));
    else if (e.key === 'Home') setPos(0);
    else if (e.key === 'End') setPos(100);
    else return;
    e.preventDefault();
  };

  return (
    <div className="ba">
      <div className="ba-head">
        <span className="label-mono text-accent">Было / стало</span>
        {list.length > 1 ? (
          <div className="ba-tabs" role="group" aria-label="Работа">
            {list.map((w, k) => (
              <button key={w.id} type="button" className="dc-chip" aria-pressed={k === index} data-cursor="none" onClick={() => setIndex(k)}>
                {w.title}
              </button>
            ))}
          </div>
        ) : (
          <span className="ba-title">{work.title}</span>
        )}
      </div>

      <div
        ref={frame}
        className="wk-frame ba-frame"
        data-cursor="none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ba-img" src={asset(work.cover)} alt={`Новый сайт ${work.title}`} loading="lazy" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={work.id}
          className="ba-img ba-before"
          src={asset(work.before!)}
          alt={`Старый сайт ${work.title}`}
          loading="lazy"
          draggable={false}
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          onError={() => setMissing((m) => [...m, work.id])}
        />

        <span className="ba-tag ba-tag--l" aria-hidden="true">
          было
        </span>
        <span className="ba-tag ba-tag--r" aria-hidden="true">
          стало
        </span>

        <div
          className="ba-handle"
          role="slider"
          tabIndex={0}
          aria-label={`Шторка: старый и новый сайт ${work.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          style={{ left: `${pos}%` }}
          onKeyDown={onKey}
        >
          <i />
        </div>
      </div>
    </div>
  );
}
