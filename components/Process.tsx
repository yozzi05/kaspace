'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/lib/useMedia';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { title: 'Заявка и короткий бриф.', text: 'Пять вопросов о бизнесе и задаче.' },
  { title: 'Бесплатное демо.', text: 'Первый экран будущего сайта под вашу нишу.' },
  { title: 'Договор, смета, сроки.', text: 'Всё фиксируется до начала работы.' },
  { title: 'Разработка с показами.', text: 'Вы видите результат по этапам, а не в конце.' },
  { title: 'Запуск и поддержка.', text: 'Перенос на домен, аналитика, правки после запуска.' },
];

/**
 * Как идёт работа: пять шагов по вертикали. Синяя полоса-курсор спускается вдоль них
 * по мере прокрутки: текущий шаг яркий, пройденные приглушены, будущие едва видны.
 */
export function Process() {
  const reduced = useReducedMotion();
  const list = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = list.current;
    const cursor = bar.current;
    if (!el || !cursor || reduced) return;

    const ctx = gsap.context(() => {
      const setY = gsap.quickSetter(cursor, 'y', 'px');
      ScrollTrigger.create({
        trigger: el,
        start: 'top 62%',
        end: 'bottom 58%',
        scrub: true,
        onUpdate: (self) => {
          const travel = el.offsetHeight - cursor.offsetHeight;
          const y = self.progress * travel;
          setY(y);
          // текущий шаг: последний, чей верх полоса уже прошла
          const mid = y + cursor.offsetHeight / 2;
          let now = 0;
          [...el.children].forEach((li, i) => {
            if ((li as HTMLElement).offsetTop <= mid) now = i;
          });
          setActive((prev) => (prev === now ? prev : now));
        },
      });
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="process" className="pr">
      <h2 className="section-title pr-title" aria-label="От заявки до запуска">
        <span aria-hidden="true">От заявки</span>
        <span className="caret blink pr-gap" aria-hidden="true" />
        <span aria-hidden="true">до запуска</span>
      </h2>

      <div className="pr-body">
        <div className="pr-list" data-static={reduced}>
          <ol ref={list}>
            {STEPS.map((s, i) => (
            <li key={s.title} className="pr-step" data-state={i < active ? 'done' : i === active ? 'now' : 'next'}>
              <span className="pr-num">0{i + 1}</span>
              <div>
                <h3 className="pr-step-title">{s.title}</h3>
                <p className="pr-step-text">{s.text}</p>
              </div>
            </li>
            ))}
          </ol>
          <span ref={bar} className="pr-bar" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
