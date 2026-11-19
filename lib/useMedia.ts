'use client';

import { useSyncExternalStore } from 'react';

/** Подписка на media-запрос. На сервере и до гидрации возвращает false. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Устройство с мышью: свой курсор, притяжение кнопок, 3D-наклон. */
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)');

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');
