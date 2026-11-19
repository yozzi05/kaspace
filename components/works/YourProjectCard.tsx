'use client';

import { useInView } from '@/lib/useInView';
import { Button } from '../Button';
import { TypedText } from '../TypedText';

const ADDRESS = 'ваш-проект.ru';

/** Последняя карточка: пустое окно браузера, курсор печатает адрес будущего сайта. */
export function YourProjectCard() {
  const [ref, seen] = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="wk-card wk-yours">
      <div className="wk-frame">
        <div className="wk-chrome">
          <span className="wk-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="wk-address" aria-label={ADDRESS}>
            <TypedText text={ADDRESS} start={seen} stepMs={95} />
          </span>
        </div>
        <div className="wk-yours-body">
          <p className="wk-yours-text">Здесь может быть ваш сайт</p>
          <Button href="#demo">Получить демо бесплатно</Button>
        </div>
      </div>
    </div>
  );
}
