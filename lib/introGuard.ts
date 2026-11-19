/* Без 'use client': строка скрипта нужна серверной странице. */

export const INTRO_KEY = 'kaspace-intro';

/** Выполняется до первой отрисовки: прячет заставку, если она уже была в этой сессии. */
export const INTRO_GUARD = `try{if(sessionStorage.getItem('${INTRO_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='done'}catch(e){}`;
