'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { TELEGRAM, telegramLink } from '@/data/services';
import { useInView } from '@/lib/useInView';
import { Button } from './Button';

const PLACEHOLDER = 'ваша ниша';

/**
 * Финальный блок: «Остался один пробел: ▮». Поле ввода встроено прямо в строку
 * заголовка на месте разрыва. Отправки на сервер нет: кнопка открывает Telegram с текстом.
 */
export function FinalCta() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [niche, setNiche] = useState('');
  const [contact, setContact] = useState('');

  const message = [
    'Хочу демо первого экрана.',
    niche.trim() ? `Ниша или сайт: ${niche.trim()}` : '',
    contact.trim() ? `Связь: ${contact.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const link = telegramLink(message);

  /* Enter в любом поле делает то же, что кнопка */
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="demo" className="fc">
      <form className="fc-form" onSubmit={onSubmit}>
        <div ref={ref} data-ready={seen}>
          <h2 className="reveal fc-title" aria-label="Остался один пробел: ваша ниша">
            <span aria-hidden="true">Остался один пробел:</span>
            {/* поле на месте разрыва: невидимая строка держит ширину по тексту */}
            <label className="fc-gap" data-empty={niche === ''}>
              <span className="sr-only">Ниша или ссылка на сайт</span>
              <span className="fc-gap-sizer" aria-hidden="true">
                {niche || PLACEHOLDER}
              </span>
              <input
                className="fc-gap-input"
                type="text"
                name="niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder={PLACEHOLDER}
                maxLength={60}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="next"
              />
              <span className="caret blink fc-gap-caret" aria-hidden="true" />
            </label>
          </h2>

          <p className="reveal fc-text" style={{ ['--d' as string]: '0.1s' }}>
            Впишите нишу или ссылку на текущий сайт. В ответ придёт концепт первого экрана.
          </p>

          <div className="reveal fc-row" style={{ ['--d' as string]: '0.2s' }}>
            <label className="fc-field">
              <span className="label-mono text-paper-dim">Как с вами связаться</span>
              <input
                type="text"
                name="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Telegram или телефон"
                maxLength={80}
                autoComplete="off"
                enterKeyHint="send"
              />
            </label>
            <Button size="lg" href={link} target="_blank" hoverLabel="Бесплатно">
              Получить демо
            </Button>
          </div>

          <ul className="reveal fc-contacts" style={{ ['--d' as string]: '0.3s' }}>
            <li>
              <span className="label-mono text-paper-dim">Telegram</span>
              <a href={TELEGRAM} target="_blank" rel="noopener noreferrer">
                @yusifkas
              </a>
            </li>
            <li>
              <span className="label-mono text-paper-dim">Телефон</span>
              <a href="tel:+79280647665">+7 928 064-76-65</a>
            </li>
          </ul>
        </div>
      </form>
    </section>
  );
}
