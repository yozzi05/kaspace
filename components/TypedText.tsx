'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useMedia';

type Props = {
  text: string;
  /** Набор начинается, когда start становится true. */
  start: boolean;
  /** Пауза между символами, мс. */
  stepMs?: number;
  onDone?: () => void;
};

/**
 * Набор текста с курсором. Весь текст сразу лежит в разметке (невидимый остаток
 * держит место), поэтому вёрстка не прыгает и текст виден поисковикам.
 * Родителю нужно задать aria-label с полным текстом.
 */
export function TypedText({ text, start, stepMs = 18, onDone }: Props) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setN(text.length);
      doneRef.current?.();
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) {
        window.clearInterval(id);
        doneRef.current?.();
      }
    }, stepMs);
    return () => window.clearInterval(id);
  }, [start, reduced, text, stepMs]);

  const typing = start && n < text.length;

  return (
    <span aria-hidden="true">
      {text.slice(0, n)}
      <span className="type-caret" data-on={typing} />
      <span className="typed-rest">{text.slice(n)}</span>
    </span>
  );
}
