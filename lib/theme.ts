'use client';

import { useSyncExternalStore } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';

export const THEME_KEY = 'kaspace-theme';
/** Тема для тех, кто ещё ничего не выбирал. То же значение стоит в lib/themeGuard.ts. */
export const DEFAULT_THEME: ThemePref = 'light';
const SYSTEM_LIGHT = '(prefers-color-scheme: light)';
const BROWSER_BAR = { light: '#F0EEE8', dark: '#0A1122' } as const;

const listeners = new Set<() => void>();

function read(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Ставит на <html> итоговую тему (data-mode) и выбор посетителя (data-theme). */
function apply(pref: ThemePref) {
  const mode = pref === 'system' ? (window.matchMedia(SYSTEM_LIGHT).matches ? 'light' : 'dark') : pref;
  const html = document.documentElement;
  html.dataset.mode = mode;
  html.dataset.theme = pref;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', BROWSER_BAR[mode]));
}

export function setTheme(pref: ThemePref) {
  try {
    // «как в системе» тоже записывается: без записи действует тема по умолчанию
    localStorage.setItem(THEME_KEY, pref);
  } catch {}
  apply(pref);
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // «Системная» следует за настройкой устройства, пока посетитель её не сменил
  const mql = window.matchMedia(SYSTEM_LIGHT);
  const onSystem = () => {
    if (read() === 'system') apply('system');
  };
  // выбор в другой вкладке подхватывается и здесь
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    apply(read());
    onChange();
  };
  mql.addEventListener('change', onSystem);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    mql.removeEventListener('change', onSystem);
    window.removeEventListener('storage', onStorage);
  };
}

/** Выбор посетителя: светлая, тёмная или системная. */
export function useTheme(): ThemePref {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_THEME);
}
