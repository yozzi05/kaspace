'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { SERVICES, telegramLink } from '@/data/services';
import { useInView } from '@/lib/useInView';
import { useReducedMotion } from '@/lib/useMedia';
import { Button } from './Button';
import { SectionTitle } from './SectionTitle';

const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ')} ₽`;

/** Число «перебегает» от старого значения к новому. */
function RollingSum({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const el = useRef<HTMLSpanElement>(null);
  const state = useRef({ v: value });

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const write = () => {
      node.textContent = rub(state.current.v);
    };
    if (reduced) {
      state.current.v = value;
      write();
      return;
    }
    const tween = gsap.to(state.current, { v: value, duration: 0.55, ease: 'power2.out', onUpdate: write });
    return () => {
      tween.kill();
    };
  }, [value, reduced]);

  return <span ref={el}>{rub(value)}</span>;
}

/** Калькулятор: чипы услуг с множественным выбором и итог справа. */
export function Calculator() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [picked, setPicked] = useState<readonly string[]>([]);

  const chosen = SERVICES.filter((s) => picked.includes(s.id));
  const sum = chosen.reduce((acc, s) => acc + (s.priceFrom ?? 0), 0);
  const hasPriced = chosen.some((s) => s.priceFrom !== null);
  const hasBrief = chosen.some((s) => s.priceFrom === null);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const message = [
    'Хочу обсудить задачу:',
    ...chosen.map((s) => `— ${s.title}`),
    hasPriced ? `Ориентир: от ${rub(sum)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <section id="calc" className="cc">
      <SectionTitle text="СОБЕРИТЕ СВОЮ ЗАДАЧУ" />

      <div ref={ref} data-ready={seen} className="cc-body">
        <div className="reveal cc-chips" role="group" aria-label="Услуги">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="cc-chip"
              aria-pressed={picked.includes(s.id)}
              data-cursor="none"
              onClick={() => toggle(s.id)}
            >
              <span>{s.title}</span>
              <span className="cc-chip-price">{s.priceFrom !== null ? s.price : 'после брифа'}</span>
            </button>
          ))}
        </div>

        <div className="reveal cc-total" style={{ ['--d' as string]: '0.12s' }} aria-live="polite">
          <span className="label-mono text-paper-dim">
            Выбрано: {chosen.length} из {SERVICES.length}
          </span>

          <p className="cc-sum">
            {hasPriced ? (
              <>
                от <RollingSum value={sum} />
              </>
            ) : hasBrief ? (
              'цена после брифа'
            ) : (
              <span className="cc-sum-empty">
                от <RollingSum value={0} />
              </span>
            )}
          </p>

          <p className="cc-extra" data-on={hasPriced && hasBrief}>
            + часть услуг считается после брифа
          </p>
          <p className="cc-note">Точная смета после короткого брифа</p>

          <div className="cc-action">
            <Button href={telegramLink(message)} target="_blank" disabled={chosen.length === 0}>
              Отправить в Telegram
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
