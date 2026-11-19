'use client';

import type { CSSProperties } from 'react';
import { useInView } from '@/lib/useInView';

const FACTS = [
  { title: 'Демо до оплаты.', text: 'Сначала концепт под вашу нишу, потом решение.' },
  { title: 'Код без шаблонов.', text: 'Next.js и React, никаких конструкторов.' },
  { title: 'Разработка и маркетинг вместе.', text: 'Сайт строится вокруг заявки, а не вокруг красоты.' },
  { title: 'Любая услуга отдельно.', text: 'Можно заказать только то, что нужно сейчас.' },
];

/** Четыре факта: одна строка с тонкими разделителями. */
export function Facts() {
  const [ref, seen] = useInView<HTMLElement>();

  return (
    <section ref={ref} data-ready={seen} aria-label="Коротко о работе" className="facts">
      <ul className="facts-row">
        {FACTS.map((f, i) => (
          <li key={f.title} className="facts-item">
            <div className="reveal" style={{ '--d': `${i * 0.09}s` } as CSSProperties}>
              <span className="label-mono text-accent">0{i + 1}</span>
              <h3 className="facts-title">{f.title}</h3>
              <p className="facts-text">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
