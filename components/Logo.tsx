type MarkProps = {
  className?: string;
  /** Цвет знака «k». По умолчанию текущий цвет текста. */
  color?: string;
  /** Цвет полосы-курсора. */
  cursorColor?: string;
  /** Курсор не мигает (фавикон, статичные места). */
  still?: boolean;
  title?: string;
};

/** Знак: «k» и полоса-курсор. */
export function LogoMark({
  className,
  color = 'currentColor',
  cursorColor = 'var(--color-accent)',
  still = false,
  title,
}: MarkProps) {
  return (
    <svg
      viewBox="280 310 550 490"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path fill={color} d="M304 330H403V615L549 436H654L549 558L663 739H551L486 630L393 739H304Z" />
      <rect
        className={still ? undefined : 'blink'}
        fill={cursorColor}
        x="699"
        y="393"
        width="108"
        height="383"
      />
    </svg>
  );
}

type BadgeProps = {
  /** Сторона плашки в px. */
  size?: number;
  still?: boolean;
  className?: string;
  title?: string;
};

/** Плашка-логотип: светлый скруглённый квадрат, знак цвета ink, курсор accent-deep. */
export function LogoBadge({ size = 48, still = false, className = '', title }: BadgeProps) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center bg-paper text-ink ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.235 }}
    >
      <LogoMark
        title={title}
        still={still}
        cursorColor="var(--color-accent-deep)"
        className="block h-[58%] w-auto"
      />
    </span>
  );
}
