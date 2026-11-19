'use client';

import { useEffect, useRef, useState } from 'react';

/** Один раз сообщает, что элемент вошёл в зону видимости. */
export function useInView<T extends Element>(rootMargin = '0px 0px -18% 0px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, rootMargin]);

  return [ref, seen] as const;
}
