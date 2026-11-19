'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useMedia';

/** Чем закрывается пробел между бизнесом и клиентом. */
const WORDS = ['сайт', 'приложение', 'бот', 'автоматизация'];

const STEP_MS = 75; // скорость набора, мс на символ
const HOLD_TICKS = 16; // пауза с готовым словом (~1.2 с)
const GAP_TICKS = 4; // пауза перед следующим словом

type Props = {
  /** Набор начинается, когда start становится true. */
  start: boolean;
  /** Пока true, набор стоит (экран ушёл из вида). */
  paused?: boolean;
};

/** Курсор в разрыве заголовка: впечатывает слово, держит, стирает, берёт следующее. */
export function GapTyper({ start, paused = false }: Props) {
  const reduced = useReducedMotion();
  const [text, setText] = useState('');
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setText(WORDS[0]);
      return;
    }
    let word = 0;
    let chars = 0;
    let dir = 1;
    let wait = 6;
    const id = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      if (wait > 0) {
        wait -= 1;
        return;
      }
      chars += dir;
      setText(WORDS[word].slice(0, chars));
      if (dir > 0 && chars === WORDS[word].length) {
        dir = -1;
        wait = HOLD_TICKS;
      } else if (dir < 0 && chars === 0) {
        dir = 1;
        word = (word + 1) % WORDS.length;
        wait = GAP_TICKS;
      }
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [start, reduced]);

  return (
    <>
      <span className="hero-typed">{text}</span>
      <span className={`hero-caret ${reduced ? '' : 'blink'}`} />
    </>
  );
}
