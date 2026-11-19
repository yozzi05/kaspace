'use client';

import { useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { SERVICES, telegramLink } from '@/data/services';
import { useInView } from '@/lib/useInView';
import { Button } from './Button';
import { SectionTitle } from './SectionTitle';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Услуги: крупный список из 12 строк. Наведение или нажатие раздвигает список:
 * активная строка и всё, что выше, уходят вверх на полразрыва, всё, что ниже, вниз,
 * а в разрыве открываются описание и кнопка. Высота списка не меняется:
 * двигаются только transform, место под сдвиг зарезервировано отступами списка.
 */
export function Services() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  /* закрывающаяся строка ещё держит кнопку, пока разрыв схлопывается */
  const [prev, setPrev] = useState<number | null>(null);
  const pointer = useRef<string>('mouse');

  const open = (i: number | null) => {
    if (i === active) return;
    setPrev(active);
    setActive(i);
  };

  /* Мышь: нажатие закрепляет строку. Касание и клавиатура: открывают и закрывают */
  const onRowClick = (i: number) => (e: MouseEvent) => {
    const byKeyboard = e.detail === 0;
    if (byKeyboard || pointer.current !== 'mouse') open(active === i ? null : i);
    else open(i);
  };

  return (
    <section id="services" className="svc">
      <SectionTitle text="ЧТО МОЖНО ЗАКАЗАТЬ" />

      <div ref={ref} data-ready={seen}>
        <ul
          className="svc-list"
          data-open={active !== null}
          onPointerLeave={(e) => e.pointerType === 'mouse' && open(null)}
        >
          {SERVICES.map((s, i) => {
            const isActive = active === i;
            const pos = active === null ? 'rest' : i <= active ? 'up' : 'down';
            return (
              <li
                key={s.id}
                className="svc-item"
                data-pos={pos}
                data-active={isActive}
                onPointerEnter={(e) => e.pointerType === 'mouse' && open(i)}
              >
                <div className="reveal" style={{ '--d': `${i * 0.04}s` } as CSSProperties}>
                  <button
                    type="button"
                    className="svc-row"
                    aria-expanded={isActive}
                    aria-controls={`svc-panel-${s.id}`}
                    data-cursor="none"
                    onPointerDown={(e) => {
                      pointer.current = e.pointerType;
                    }}
                    onClick={onRowClick(i)}
                  >
                    <span className="svc-num">{pad(i + 1)}</span>
                    <span className="svc-name">
                      {s.title}
                      <span className="caret blink svc-caret" aria-hidden="true" />
                    </span>
                    <span className="svc-price">{s.price}</span>
                  </button>
                </div>

                <div id={`svc-panel-${s.id}`} role="region" aria-label={s.title} className="svc-panel" inert={!isActive}>
                  <div className="svc-panel-inner">
                    <span className="svc-count">
                      {pad(i + 1)} / {SERVICES.length}
                    </span>
                    <p className="svc-desc">{s.includes}</p>
                    <div className="svc-action">
                      {(isActive || prev === i) && (
                        <Button href={telegramLink(`Хочу обсудить услугу: ${s.title}`)} target="_blank">
                          Обсудить
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
