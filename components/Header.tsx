'use client';

import { useEffect, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { Button } from './Button';
import { LogoBadge } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';
import { Wordmark } from './Wordmark';

const LINKS = [
  { href: '#services', label: 'Услуги' },
  { href: '#works', label: 'Работы' },
  { href: '#reels', label: 'Ролики' },
  { href: '#process', label: 'Процесс' },
  { href: '#faq', label: 'Вопросы' },
];

const SPRING = { type: 'spring', stiffness: 360, damping: 34, mass: 0.9 } as const;

/** Шапка. При прокрутке вниз сжимается в пилюлю (FLIP-анимация: только transform и opacity). */
export function Header() {
  const [pill, setPill] = useState(false);

  useEffect(() => {
    const onScroll = () => setPill(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <MotionConfig reducedMotion="user" transition={SPRING}>
      <motion.header
        layoutRoot
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-8 md:pt-5 lg:px-12"
      >
        <div
          className={`pointer-events-auto relative flex w-full items-center justify-between ${
            pill ? 'h-14 max-w-[900px] pr-2 pl-4' : 'h-14 max-w-[1320px] px-2 sm:px-0 md:h-16'
          }`}
        >
          <motion.span
            layout
            aria-hidden="true"
            className="absolute inset-0 bg-ink-2"
            initial={false}
            animate={{ opacity: pill ? 1 : 0 }}
            style={{ borderRadius: 999, boxShadow: 'inset 0 0 0 1px var(--color-line)' }}
          />

          <motion.a
            layout="position"
            href="#top"
            aria-label="kaspace, в начало страницы"
            data-cursor="none"
            className="relative flex items-center gap-3"
          >
            <LogoBadge size={36} />
            {/* на самых узких экранах остаётся только плашка: рядом стоят тема и кнопка */}
            <Wordmark className="hdr-word text-[26px]" />
          </motion.a>

          <motion.nav layout="position" aria-label="Разделы" className="relative hidden lg:block">
            <ul className="flex items-center gap-7">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-[15px] font-medium opacity-70 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.div layout="position" className="relative flex items-center gap-2">
            <ThemeSwitch />
            <Button size="sm" href="#demo" hoverLabel="Бесплатно">
              Получить демо
            </Button>
          </motion.div>
        </div>
      </motion.header>
    </MotionConfig>
  );
}
