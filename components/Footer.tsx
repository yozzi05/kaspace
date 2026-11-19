'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { TELEGRAM } from '@/data/services';
import { useFinePointer, useReducedMotion } from '@/lib/useMedia';

const LETTERS = ['k', 'a', 's', 'p', 'a', 'c', 'e'];

const LINKS = [
  { href: '#services', label: 'Услуги' },
  { href: '#works', label: 'Работы' },
  { href: '#reels', label: 'Ролики' },
  { href: '#process', label: 'Процесс' },
  { href: '#faq', label: 'Вопросы' },
];

const YEAR = new Date().getFullYear();

/**
 * Подвал: огромное «kaspace» во всю ширину. Курсор стоит в конце слова, а под мышью
 * переходит в ближайший промежуток между буквами, как текстовый курсор.
 */
export function Footer() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const word = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLSpanElement>(null);

  /* Размер шрифта подгоняется так, чтобы слово с курсором заняло всю ширину */
  useEffect(() => {
    const el = word.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '100px';
      const natural = el.scrollWidth;
      const room = el.parentElement!.clientWidth;
      el.style.fontSize = `${(100 * room) / natural}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  /* Курсор следует за мышью по горизонтали в пределах слова */
  useEffect(() => {
    const el = word.current;
    const bar = caret.current;
    if (!el || !bar || !fine || reduced) return;

    const xTo = gsap.quickTo(bar, 'x', { duration: 0.28, ease: 'power3.out' });
    const letters = [...el.querySelectorAll<HTMLElement>('.ft-letter')];

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      // позиции курсора: перед первой буквой, между буквами и в конце слова (его обычное место)
      const home = bar.getBoundingClientRect().left - (Number(gsap.getProperty(bar, 'x')) || 0);
      const stops = [letters[0].getBoundingClientRect().left, ...letters.map((l) => l.getBoundingClientRect().right)];
      let best = stops[stops.length - 1];
      for (const s of stops) if (Math.abs(s - e.clientX) < Math.abs(best - e.clientX)) best = s;
      const last = stops[stops.length - 1];
      const away = best !== last;
      // между буквами полоса становится тонкой, чтобы не перекрывать их
      bar.dataset.away = String(away);
      xTo(away ? best - home - bar.offsetWidth / 2 : 0);
    };
    const onLeave = () => {
      bar.dataset.away = 'false';
      xTo(0);
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(bar);
      gsap.set(bar, { x: 0 });
    };
  }, [fine, reduced]);

  return (
    <footer className="ft">
      <div className="ft-wordwrap">
        <div ref={word} className="ft-word" role="img" aria-label="kaspace" data-cursor="none">
          {LETTERS.map((ch, i) => (
            <span key={i} aria-hidden="true" className={`ft-letter ${i === 2 ? 'text-accent' : ''}`}>
              {ch}
            </span>
          ))}
          <span ref={caret} aria-hidden="true" className="ft-caret">
            <i className="blink" />
          </span>
        </div>
      </div>

      <div className="ft-bottom">
        <nav aria-label="Разделы">
          <ul className="ft-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="ft-contacts">
          <li>
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer">
              Telegram @yusifkas
            </a>
          </li>
          <li>
            <a href="tel:+79280647665">+7 928 064-76-65</a>
          </li>
        </ul>

        <p className="ft-year label-mono">© {YEAR} kaspace</p>
      </div>
    </footer>
  );
}
