'use client';

import { useSyncExternalStore } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';

export const THEME_KEY = 'kaspace-theme';
const SYSTEM_LIGHT = '(prefers-color-scheme: light)';
const BROWSER_BAR = { light: '#F0EEE8', dark: '#0A1122' } as const;

const listeners = new Set<() => void>();

function read(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
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
    if (pref === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
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
  return useSyncExternalStore(subscribe, read, () => 'system');
}
