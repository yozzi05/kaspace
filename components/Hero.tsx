'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useIntroDone } from '@/lib/intro';
import { useMedia } from '@/lib/useMedia';
import { Button } from './Button';
import { GapTyper } from './GapTyper';
import { Wordmark } from './Wordmark';

const TITLE = 'Между бизнесом и клиентом пробел. kaspace его заполняет.';

/** За какую долю высоты экрана первый экран гаснет при прокрутке. */
const FADE_SPAN = 0.7;

const delay = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;

export function Hero() {
  const ready = useIntroDone();
  const wide = useMedia('(min-width: 768px)');
  const ref = useRef<HTMLElement>(null);
  const [away, setAway] = useState(false);

  /* Первый экран плавно гаснет, пока страница уходит вниз */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * FADE_SPAN)));
      el.style.setProperty('--f', (1 - p).toFixed(3));
      setAway(p > 0.6);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section id="top" ref={ref} data-ready={ready} className="hero">
      <div className="hero-inner">
        <p className="reveal label-mono text-paper-dim">
          <span className="max-md:hidden">Веб-агентство · </span>
          Сайты · Приложения · ИИ
          <span className="max-md:hidden">-автоматизация</span>
        </p>

        <h1 className="hero-row" aria-label={TITLE}>
          <span aria-hidden="true" className="hero-word hero-word--l">
            бизнес
          </span>
          <span aria-hidden="true" className="hero-gap">
            <GapTyper start={ready} paused={away} />
          </span>
          <span aria-hidden="true" className="hero-word hero-word--r">
            клиент
          </span>
        </h1>

        <p className="reveal hero-say" style={delay(0.55)}>
          Между ними пробел. <Wordmark caret={false} /> его заполняет.
        </p>
        <p className="reveal hero-sub" style={delay(0.7)}>
          Сайты, приложения и ИИ-автоматизация на кастомном коде. Демо первого экрана под вашу нишу вы получаете до
          оплаты.
        </p>
        <div className="reveal hero-cta" style={delay(0.85)}>
          <Button size={wide ? 'lg' : 'md'} href="#demo">
            Получить демо бесплатно
          </Button>
          <Button size={wide ? 'lg' : 'md'} variant="outline" href="#works" cursor="none">
            Смотреть работы
          </Button>
        </div>

        <div className="reveal hero-scroll" style={delay(1.3)} aria-hidden="true">
          <span className="label-mono">Листайте вниз</span>
          <i />
        </div>
      </div>
    </section>
  );
}
