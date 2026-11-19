'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEventHandler, PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import { motion } from 'motion/react';
import { useFinePointer, useReducedMotion } from '@/lib/useMedia';
import { useRetype } from '@/lib/useRetype';
import type { CursorKind } from './CustomCursor';

const MAGNET_RADIUS = 80; // px от края кнопки
const MAGNET_PULL = 0.32; // доля смещения курсора от центра

type Props = {
  /** Текст кнопки. */
  children: string;
  /** Текст, в который кнопка перепечатывается при наведении. */
  hoverLabel?: string;
  variant?: 'primary' | 'outline' | 'onpaper';
  size?: 'sm' | 'md' | 'lg';
  /** Если задан, кнопка рендерится ссылкой. */
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  /** Во что превращается свой курсор над кнопкой. */
  cursor?: CursorKind;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

export function Button({
  children,
  hoverLabel,
  variant = 'primary',
  size = 'md',
  href,
  target,
  rel,
  type = 'button',
  disabled = false,
  cursor = 'write',
  className = '',
  onClick,
}: Props) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);

  const label = hover && hoverLabel ? hoverLabel : children;
  const { shown, typing } = useRetype(label, { instant: reduced });

  /* Притяжение к курсору в радиусе 80px */
  useEffect(() => {
    const el = wrap.current;
    if (!el || !fine || reduced || disabled) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
    let pulled = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      // прямоугольник кнопки в покое, без текущего смещения
      const ox = Number(gsap.getProperty(el, 'x')) || 0;
      const oy = Number(gsap.getProperty(el, 'y')) || 0;
      const left = r.left - ox;
      const top = r.top - oy;
      const dx = Math.max(left - e.clientX, 0, e.clientX - (left + r.width));
      const dy = Math.max(top - e.clientY, 0, e.clientY - (top + r.height));

      // над соседними элементами с data-no-magnet кнопка не тянется: иначе она наезжает на них
      const blocked = e.target instanceof Element && e.target.closest('[data-no-magnet]') !== null;

      if (!blocked && Math.hypot(dx, dy) <= MAGNET_RADIUS) {
        pulled = true;
        xTo((e.clientX - (left + r.width / 2)) * MAGNET_PULL);
        yTo((e.clientY - (top + r.height / 2)) * MAGNET_PULL);
      } else if (pulled) {
        pulled = false;
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: true });
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [fine, reduced, disabled]);

  /* Заливка расходится кругом от точки входа (и сходится в точку выхода) */
  const runFill = (show: boolean, clientX?: number, clientY?: number) => {
    const f = fill.current;
    const btn = f?.parentElement;
    if (!f || !btn) return;
    const r = btn.getBoundingClientRect();
    const x = clientX === undefined ? r.width / 2 : clientX - r.left;
    const y = clientY === undefined ? r.height / 2 : clientY - r.top;
    const radius = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 2;

    gsap.set(f, { left: x, top: y, width: radius * 2, height: radius * 2, xPercent: -50, yPercent: -50 });
    gsap.to(f, {
      scale: show ? 1 : 0,
      duration: reduced ? 0 : show ? 0.55 : 0.4,
      ease: show ? 'power3.out' : 'power2.in',
      overwrite: true,
    });
  };

  const onEnter = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    setHover(true);
    runFill(true, e.clientX, e.clientY);
  };
  const onLeave = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    setHover(false);
    runFill(false, e.clientX, e.clientY);
  };

  const hasAlt = variant === 'outline';
  const text = (
    <>
      {shown}
      <i className="btn-caret" />
    </>
  );

  const shared = {
    className: `btn btn--${variant} btn--${size} ${className}`,
    'data-cursor': cursor,
    'data-hover': hover,
    'data-typing': typing,
    'aria-label': children,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.matches(':focus-visible')) return;
      setHover(true);
      runFill(true);
    },
    onBlur: () => {
      if (!hover) return;
      setHover(false);
      runFill(false);
    },
    onClick,
    whileTap: reduced ? undefined : { scale: 0.97 },
    transition: { type: 'spring', stiffness: 520, damping: 14, mass: 0.7 } as const,
  };

  const inner = (
    <>
      <span ref={fill} className="btn-fill" aria-hidden="true" />
      <span className="btn-label" aria-hidden="true">
        <span className="btn-sizer">{children}</span>
        {hoverLabel && <span className="btn-sizer">{hoverLabel}</span>}
        <span className={`btn-text btn-text--base ${hasAlt ? 'has-alt' : ''}`}>{text}</span>
        {hasAlt && <span className="btn-text btn-text--alt">{text}</span>}
      </span>
    </>
  );

  return (
    <span ref={wrap} className="btn-magnet">
      {href ? (
        <motion.a
          {...shared}
          href={disabled ? undefined : href}
          target={target}
          rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
          aria-disabled={disabled || undefined}
        >
          {inner}
        </motion.a>
      ) : (
        <motion.button {...shared} type={type} disabled={disabled}>
          {inner}
        </motion.button>
      )}
    </span>
  );
}
