'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useInView } from '@/lib/useInView';
import { SectionTitle } from './SectionTitle';
import { TypedText } from './TypedText';

const FAQ = [
  { q: 'Сколько стоит сайт?', a: 'Лендинг от 35 000 ₽. Точная цена зависит от задачи и считается после брифа.' },
  { q: 'Что если демо не понравится?', a: 'Вы ничего не должны. Демо делается бесплатно и без обязательств.' },
  { q: 'Можно заказать только одну услугу?', a: 'Да. Логотип, ролик или бот заказываются отдельно от сайта.' },
  {
    q: 'На чём делаются сайты?',
    a: 'На Next.js и React. Конструкторы не используются, поэтому сайт быстро грузится и дорабатывается без ограничений.',
  },
  { q: 'Сколько времени занимает работа?', a: 'Срок называется после брифа и фиксируется в договоре.' },
  { q: 'Кто пишет тексты?', a: 'Структуру и тексты готовит kaspace, вы согласуете.' },
];

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Вопросы: аккордеон с тем же раздвиганием, что и список услуг. Строки расходятся
 * вверх и вниз (только transform), ответ набирается в открывшемся разрыве.
 */
export function Faq() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  /* счётчик открытий: при каждом открытии ответ набирается заново */
  const [run, setRun] = useState(0);

  const toggle = (i: number) => {
    setActive((cur) => (cur === i ? null : i));
    setRun((n) => n + 1);
  };

  return (
    <section id="faq" className="fq">
      <SectionTitle text="ВОПРОСЫ" />

      <div ref={ref} data-ready={seen}>
        <ul className="fq-list" data-open={active !== null}>
          {FAQ.map((item, i) => {
            const isActive = active === i;
            const pos = active === null ? 'rest' : i <= active ? 'up' : 'down';
            return (
              <li key={item.q} className="fq-item" data-pos={pos} data-active={isActive}>
                <h3 className="reveal" style={{ '--d': `${i * 0.05}s` } as CSSProperties}>
                  <button
                    type="button"
                    className="fq-row"
                    aria-expanded={isActive}
                    aria-controls={`faq-${i}`}
                    data-cursor="none"
                    onClick={() => toggle(i)}
                  >
                    <span className="fq-num">{pad(i + 1)}</span>
                    <span className="fq-q">{item.q}</span>
                    <span className="fq-mark" aria-hidden="true" />
                  </button>
                </h3>

                <div id={`faq-${i}`} role="region" aria-label={item.q} className="fq-panel" inert={!isActive}>
                  <p className="fq-a" aria-label={item.a}>
                    <TypedText key={isActive ? run : 'idle'} text={item.a} start={isActive} stepMs={14} />
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
