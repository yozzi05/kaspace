'use client';

import { setTheme, useTheme } from '@/lib/theme';
import type { ThemePref } from '@/lib/theme';

const OPTIONS: readonly { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Светлая тема' },
  { value: 'dark', label: 'Тёмная тема' },
  { value: 'system', label: 'Как в системе' },
];

function Icon({ name }: { name: ThemePref }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (name === 'light') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1" />
      </svg>
    );
  }
  if (name === 'dark') {
    return (
      <svg {...common}>
        <path d="M13.4 9.6A5.6 5.6 0 0 1 6.4 2.6a5.6 5.6 0 1 0 7 7Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="1.8" y="2.6" width="12.4" height="8.4" rx="1.2" />
      <path d="M5.6 13.6h4.8M8 11v2.6" />
    </svg>
  );
}

/**
 * Переключатель темы: светлая, тёмная, системная.
 * На широком экране три кнопки; на узком одна, она перебирает темы по кругу.
 */
export function ThemeSwitch() {
  const pref = useTheme();
  const index = OPTIONS.findIndex((o) => o.value === pref);
  const next = OPTIONS[(index + 1) % OPTIONS.length];

  return (
    <>
      <div className="ts" role="radiogroup" aria-label="Тема сайта">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={pref === o.value}
            aria-label={o.label}
            title={o.label}
            data-cursor="none"
            onClick={() => setTheme(o.value)}
          >
            <Icon name={o.value} />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="ts-cycle"
        aria-label={`${OPTIONS[index].label}. Переключить: ${next.label.toLowerCase()}`}
        title={OPTIONS[index].label}
        data-cursor="none"
        onClick={() => setTheme(next.value)}
      >
        <Icon name={pref} />
      </button>
    </>
  );
}
