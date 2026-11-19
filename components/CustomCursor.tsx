'use client';

import { useEffect, useRef } from 'react';
import { useFinePointer } from '@/lib/useMedia';

/**
 * Свой курсор: вертикальная синяя полоса.
 * Над элементом с data-cursor превращается в пилюлю с подписью:
 *   data-cursor="demo"  → «смотреть демо» (работы)
 *   data-cursor="write" → «написать» (кнопки)
 *   data-cursor="любой текст" → этот текст
 * Работает только на устройствах с мышью.
 */
export const CURSOR_LABELS = {
  demo: 'смотреть демо',
  write: 'написать',
} as const;

export type CursorKind = keyof typeof CURSOR_LABELS | 'none' | (string & {});

export function CustomCursor() {
  const fine = useFinePointer();
  const root = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const pillEl = pill.current;
    if (!fine || !el || !pillEl) return;

    const html = document.documentElement;
    let current = '';

    const setKind = (target: EventTarget | null) => {
      const host = target instanceof Element ? target.closest<HTMLElement>('[data-cursor]') : null;
      const key = host?.dataset.cursor ?? '';
      if (key === current) return;
      current = key;
      if (!key || key === 'none') {
        el.dataset.kind = 'bar';
        return;
      }
      pillEl.textContent = CURSOR_LABELS[key as keyof typeof CURSOR_LABELS] ?? key;
      el.dataset.kind = 'pill';
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (el.dataset.visible !== 'true') {
        el.dataset.visible = 'true';
        html.classList.add('has-kcursor');
      }
      setKind(e.target);
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      // внутри iframe событий мыши нет: свой курсор прячется, там работает системный
      if (e.target instanceof HTMLIFrameElement) hide();
      else setKind(e.target);
    };
    const hide = () => {
      el.dataset.visible = 'false';
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) hide();
    };
    const onDown = () => {
      el.dataset.down = 'true';
    };
    const onUp = () => {
      el.dataset.down = 'false';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('blur', hide);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('blur', hide);
      html.classList.remove('has-kcursor');
    };
  }, [fine]);

  if (!fine) return null;

  return (
    <div ref={root} className="kcursor" data-kind="bar" data-visible="false" aria-hidden="true">
      <span className="kcursor-bar" />
      <span ref={pill} className="kcursor-pill" />
    </div>
  );
}
