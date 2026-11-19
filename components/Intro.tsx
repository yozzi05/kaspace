'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { markIntroDone } from '@/lib/intro';
import { INTRO_KEY } from '@/lib/introGuard';

const LETTERS = ['k', 'a', 's', 'p', 'a', 'c', 'e'];

/**
 * Вход: тёмный экран, курсор печатает «kaspace», полоса курсора растягивается
 * на весь экран и открывает страницу. 1.78 с, один раз за сессию.
 */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;

    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(INTRO_KEY));
    } catch {}
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!el || seen || reduced || html.dataset.intro === 'done') {
      html.dataset.intro = 'done';
      markIntroDone();
      return;
    }

    const letters = el.querySelectorAll<HTMLElement>('.intro-letter');
    const caret = el.querySelector<HTMLElement>('.intro-caret')!;
    const sheet = el.querySelector<HTMLElement>('.intro-sheet')!;
    const hideAtCover = el.querySelectorAll<HTMLElement>('.intro-bg, .intro-word');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      letters.forEach((letter, i) => tl.set(letter, { display: 'inline' }, 0.3 + i * 0.085));

      // полоса курсора растягивается на весь экран
      tl.call(() => caret.classList.remove('blink'), [], 1.0);
      tl.to(
        caret,
        {
          opacity: 1,
          scaleX: () => {
            const r = caret.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            return (2 * Math.max(cx, window.innerWidth - cx)) / r.width + 1;
          },
          scaleY: () => {
            const r = caret.getBoundingClientRect();
            const cy = r.top + r.height / 2;
            return (2 * Math.max(cy, window.innerHeight - cy)) / r.height + 1;
          },
          duration: 0.42,
          ease: 'power3.in',
        },
        1.0,
      );

      // синий лист уезжает вверх и открывает страницу
      tl.set(sheet, { opacity: 1 }, 1.42);
      tl.set(hideAtCover, { opacity: 0 }, 1.42);
      tl.call(markIntroDone, [], 1.42);
      tl.to(sheet, { yPercent: -100, duration: 0.36, ease: 'power3.inOut' }, 1.42);
      tl.call(
        () => {
          html.dataset.intro = 'done';
          try {
            sessionStorage.setItem(INTRO_KEY, '1');
          } catch {}
        },
        [],
        1.78,
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="intro" aria-hidden="true">
      <div className="intro-bg" />
      <div className="intro-word wordmark">
        <span className="intro-sizer">
          kaspace
          <span className="caret" />
        </span>
        <span className="intro-typed">
          {LETTERS.map((ch, i) => (
            <span key={i} className={`intro-letter ${i === 2 ? 'text-accent' : ''}`}>
              {ch}
            </span>
          ))}
          <span className="caret blink intro-caret" />
        </span>
      </div>
      <div className="intro-sheet" />
    </div>
  );
}
