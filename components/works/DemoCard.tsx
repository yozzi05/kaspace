'use client';

import { useEffect, useRef, useState } from 'react';
import type { Work } from '@/data/works';
import { asset } from '@/lib/asset';
import { useFinePointer, useMedia, useReducedMotion } from '@/lib/useMedia';
import { useRetype } from '@/lib/useRetype';

/** Во сколько раз клипы идут быстрее записи. Подписи шагов привязаны ко времени клипа и не съезжают. */
const SPEED = 1.5;

const pad = (n: number) => String(n).padStart(2, '0');

type Props = {
  work: Work;
  /** Номер работы в общем списке, с единицы. */
  n: number;
  total: number;
};

/**
 * Карточка крупной работы: в рамке идут записи реальных сценариев на сайте.
 * Сверху полоса сегментов, как в сторис; под рамкой чипы с названиями функций.
 * Клип играет при наведении; видео не грузится до первого запуска (preload="none").
 * Полноэкранный просмотр из этой карточки не открывается.
 */
export function DemoCard({ work, n, total }: Props) {
  const phone = useMedia('(max-width: 767px)');
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const demos = work.demos;

  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [hover, setHover] = useState(false);
  const [manual, setManual] = useState(false); // «меньше движения»: запуск только по кнопке
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);

  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fill = useRef<HTMLElement>(null);

  const demo = demos[Math.min(index, demos.length - 1)];
  const media = phone ? demo.mob : demo.desk;
  /* С мышью клип идёт, пока курсор на рамке. На сенсорном экране наведения нет: клип идёт в зоне видимости */
  const active = fine ? hover : inView;
  const shouldPlay = active && (!reduced || manual);
  const clipKey = `${demo.id}-${phone ? 'mob' : 'desk'}`;

  const caption = stepIndex >= 0 ? (media.steps[stepIndex]?.text ?? '') : '';
  const { shown } = useRetype(caption, { stepMs: 24, instant: reduced, initial: '' });

  const pick = (i: number) => {
    setIndex(i);
    setStarted(false);
    setStepIndex(-1);
  };

  /* Клип играет только в зоне видимости */
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // скорость ставится на каждый новый клип: при смене источника браузер её сбрасывает
    v.defaultPlaybackRate = SPEED;
    v.playbackRate = SPEED;
    if (shouldPlay) v.play().catch(() => {});
    else v.pause();
  }, [shouldPlay, clipKey]);

  /* Заполнение сегмента и смена подписи шага по ходу клипа */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const v = video.current;
      if (v) {
        const total = v.duration || media.duration || 1;
        if (fill.current) fill.current.style.transform = `scaleX(${Math.min(1, v.currentTime / total).toFixed(4)})`;
        let s = -1;
        for (let k = 0; k < media.steps.length; k++) if (v.currentTime >= media.steps[k].at) s = k;
        setStepIndex((prev) => (prev === s ? prev : s));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, media]);

  /* Клип закончился: включается следующий, после последнего снова первый */
  const onEnded = () => {
    setPlaying(false);
    if (reduced) setManual(false);
    pick((index + 1) % demos.length);
  };

  return (
    <article id={`work-${work.id}`} className="wk-card" data-size="lg" data-shape={phone ? 'phone' : 'browser'}>
      <div
        ref={frame}
        className="wk-frame dc-frame"
        data-work-frame={work.id}
        data-cursor="none"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
      >
        {!phone && (
          <div className="wk-chrome" aria-hidden="true">
            <span className="wk-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="wk-address">{work.title}</span>
          </div>
        )}

        <div className="dc-screen" data-started={started}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={`poster-${clipKey}`} className="dc-poster" src={asset(media.poster)} alt="" loading="lazy" draggable={false} />
          <video
            key={clipKey}
            ref={video}
            className="dc-video"
            muted
            playsInline
            preload="none"
            aria-label={`${work.title}: ${demo.label}, запись экрана`}
            onPlaying={(e) => {
              if (e.currentTarget.playbackRate !== SPEED) e.currentTarget.playbackRate = SPEED;
              setStarted(true);
              setPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onEnded={onEnded}
          >
            <source src={asset(media.mp4)} type="video/mp4" />
            <source src={asset(media.webm)} type="video/webm" />
          </video>

          <div className="dc-segs" aria-hidden="true">
            {demos.map((d, i) => (
              <span key={d.id} className="dc-seg" data-state={i < index ? 'done' : i === index ? 'now' : 'next'}>
                <i key={i === index ? clipKey : 'idle'} ref={i === index ? fill : undefined} />
              </span>
            ))}
          </div>

          <p className="dc-caption" data-on={Boolean(shown)} aria-hidden="true">
            {shown}
          </p>
        </div>

        {reduced && !playing && (
          <button
            type="button"
            className="dc-play"
            data-cursor="none"
            aria-label={`Воспроизвести запись: ${demo.label}`}
            onClick={() => setManual(true)}
          />
        )}
      </div>

      <div className="dc-chips" role="group" aria-label={`Функции: ${work.title}`}>
        {demos.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className="dc-chip"
            aria-pressed={i === index}
            data-cursor="none"
            onClick={() => pick(i)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="wk-meta">
        <span className="wk-count">
          {pad(n)} / {pad(total)}
        </span>
        <div>
          <h3 className="wk-title">{work.title}</h3>
          <p className="wk-niche">{work.niche}</p>
        </div>
      </div>
    </article>
  );
}
