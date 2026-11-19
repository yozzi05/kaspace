type Props = {
  className?: string;
  /** Показывать полосу-курсор в конце. */
  caret?: boolean;
  /** Курсор не мигает. */
  still?: boolean;
  /** Цвет буквы «s» и курсора (на светлом фоне: accent-deep). */
  accent?: string;
};

/** Название «kaspace»: Familjen Grotesk 700, синяя «s», мигающая полоса в конце. */
export function Wordmark({ className = '', caret = true, still = false, accent }: Props) {
  const style = accent ? { color: accent } : undefined;
  return (
    <span className={`wordmark ${className}`} role="img" aria-label="kaspace">
      <span aria-hidden="true">
        ka
        <span className="text-accent" style={style}>
          s
        </span>
        pace
      </span>
      {caret && (
        <span
          aria-hidden="true"
          className={`caret ${still ? '' : 'blink'}`}
          style={accent ? { background: accent } : undefined}
        />
      )}
    </span>
  );
}
