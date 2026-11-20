/* Без 'use client': строка скрипта нужна серверной разметке. */

/**
 * Выполняется до первой отрисовки: ставит тему на <html>, чтобы страница
 * не мигала тёмной перед светлой. Ключ и тема по умолчанию (светлая) те же, что в lib/theme.ts.
 */
export const THEME_GUARD = `try{var p=localStorage.getItem('kaspace-theme');p=p==='light'||p==='dark'||p==='system'?p:'light';var m=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;var d=document.documentElement;d.dataset.mode=m;d.dataset.theme=p}catch(e){document.documentElement.dataset.mode='light';document.documentElement.dataset.theme='light'}`;
