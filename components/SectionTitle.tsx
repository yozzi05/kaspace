'use client';

import { useInView } from '@/lib/useInView';
import { TypedText } from './TypedText';

/** Заголовок раздела: набирается с курсором, когда доходит до зоны видимости. */
export function SectionTitle({ text, className = '' }: { text: string; className?: string }) {
  const [ref, seen] = useInView<HTMLHeadingElement>();

  return (
    <h2 ref={ref} aria-label={text} className={`section-title ${className}`}>
      <TypedText text={text} start={seen} stepMs={38} />
    </h2>
  );
}
