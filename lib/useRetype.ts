'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Посимвольная перепечатка: показанный текст стирается до общего начала
 * с целевым и набирается заново. Прерывается в любой момент.
 */
export function useRetype(
  target: string,
  { instant = false, stepMs = 26, initial }: { instant?: boolean; stepMs?: number; initial?: string } = {},
) {
  // initial: с какого текста начать (по умолчанию сразу показан целевой)
  const [shown, setShown] = useState(initial ?? target);
  const shownRef = useRef(initial ?? target);

  useEffect(() => {
    if (instant) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    if (shownRef.current === target) return;

    const id = window.setInterval(() => {
      const cur = shownRef.current;
      const next = target.startsWith(cur) ? target.slice(0, cur.length + 1) : cur.slice(0, -1);
      shownRef.current = next;
      setShown(next);
      if (next === target) window.clearInterval(id);
    }, stepMs);

    return () => window.clearInterval(id);
  }, [target, instant, stepMs]);

  return { shown, typing: shown !== target };
}
