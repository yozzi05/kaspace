'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MotionConfig, motion } from 'motion/react';
import { telegramLink } from '@/data/services';
import type { Work } from '@/data/works';
import { asset } from '@/lib/asset';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';
import { useMedia, useReducedMotion } from '@/lib/useMedia';
import { Button } from '../Button';
import { IFRAME_SANDBOX } from './WorkCard';
import { WorkTour } from './WorkTour';

const PHONE = { width: 390, height: 844 };
const SPRING = { type: 'spring', duration: 0.6, bounce: 0.16 } as const;

type Device = 'desktop' | 'phone';

const pad = (n: number) => String(n).padStart(2, '0');
const frameOf = (id: string) => document.querySelector<HTMLElement>(`[data-work-frame="${id}"]`);

type Props = {
  works: readonly Work[];
  /** Работа, с которой открыт просмотр. */
  startId: string;
  onClose: () => void;
};

/**
 * Полноэкранный просмотр живого демо. Рамка карточки разворачивается на весь экран
 * и сворачивается обратно; переключатель меняет форму рамки между окном браузера и телефоном.
 */
export function WorkViewer({ works, startId, onClose }: Props) {
  const reduced = useReducedMotion();
  const roomy = useMedia('(min-width: 768px)'); // на телефоне переключателя устройств нет
  const [id, setId] = useState(startId);
  const [device, setDevice] = useState<Device>('desktop');
  const [loaded, setLoaded] = useState(false);
  const [phoneScale, setPhoneScale] = useState(1);
  const [tour, setTour] = useState(false); // режим «Разбор»

  const root = useRef<HTMLDivElement>(null);
  const flip = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  const index = Math.max(0, works.findIndex((w) => w.id === id));
  const work = works[index];
  const asPhone = roomy && device === 'phone';

  const go = useCallback(
    (step: number) => {
      setLoaded(false);
      setId(works[(index + step + works.length) % works.length].id);
    },
    [index, works],
  );

  /* Закрытие: рамка возвращается в свою карточку */
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = root.current;
    const box = flip.current;
    const card = frameOf(id);
    const done = () => onClose();
    if (!el || !box || reduced) return done();

    const tl = gsap.timeline({ onComplete: done });
    tl.to(el.querySelectorAll('.wv-backdrop, .wv-bar, .wv-foot'), { opacity: 0, duration: 0.3, ease: 'none' }, 0);

    const to = card?.getBoundingClientRect();
    const onScreen = to && to.bottom > 0 && to.top < window.innerHeight && to.right > 0 && to.left < window.innerWidth;
    if (to && onScreen && !asPhone) {
      const from = box.getBoundingClientRect();
      tl.to(
        box,
        {
          x: to.left - from.left,
          y: to.top - from.top,
          scaleX: to.width / from.width,
          scaleY: to.height / from.height,
          duration: 0.55,
          ease: 'power3.inOut',
        },
        0,
      );
      tl.to(box, { opacity: 0, duration: 0.15, ease: 'none' }, 0.45);
    } else {
      tl.to(box, { opacity: 0, scale: 0.97, duration: 0.3, ease: 'power2.in' }, 0);
    }
  }, [asPhone, id, onClose, reduced]);

  /* Открытие: рамка разворачивается из карточки на весь экран */
  useLayoutEffect(() => {
    const el = root.current;
    const box = flip.current;
    if (!el || !box || reduced) return;
    const from = frameOf(startId)?.getBoundingClientRect();
    const to = box.getBoundingClientRect();

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('.wv-backdrop, .wv-bar, .wv-foot'), { opacity: 0, duration: 0.4, ease: 'none' });
      if (from) {
        gsap.from(box, {
          x: from.left - to.left,
          y: from.top - to.top,
          scaleX: from.width / to.width,
          scaleY: from.height / to.height,
          duration: 0.6,
          ease: 'power3.inOut',
        });
      } else {
        gsap.from(box, { opacity: 0, scale: 0.97, duration: 0.4, ease: 'power2.out' });
      }
    }, el);
    return () => ctx.revert();
    // только при открытии
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Прокрутка страницы стоит, фокус уходит в просмотр и возвращается на карточку */
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    lockScroll();
    closeBtn.current?.focus({ preventScroll: true });
    return () => {
      unlockScroll();
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        // фокус не выходит за пределы просмотра
        const items = root.current?.querySelectorAll<HTMLElement>('button, a[href], iframe');
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, go]);

  /* Телефон 390×844 вписывается в сцену по высоте и ширине */
  useEffect(() => {
    const el = flip.current;
    if (!el) return;
    const measure = () =>
      setPhoneScale(Math.min(1, el.clientHeight / PHONE.height, el.clientWidth / PHONE.width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pickDevice = (next: Device) => {
    setTour(false); // разбор идёт на скриншоте для компьютера
    if (next === device) return;
    setLoaded(false);
    setDevice(next);
  };

  const toggleTour = () => {
    if (!tour && device === 'phone') {
      setLoaded(false);
      setDevice('desktop');
    }
    setTour((t) => !t);
  };

  const frameStyle = asPhone
    ? { width: PHONE.width * phoneScale, height: PHONE.height * phoneScale, borderRadius: 34 * phoneScale }
    : { width: '100%', height: '100%', borderRadius: 14 };

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className="wv" role="dialog" aria-modal="true" aria-label={`Демо: ${work.title}`} data-lenis-prevent>
        <div className="wv-backdrop" onClick={close} />

        <header className="wv-bar">
          <div className="wv-info">
            <span className="wv-count">
              {pad(index + 1)} / {pad(works.length)}
            </span>
            <span className="wv-title">{work.title}</span>
            <span className="wv-niche">{work.niche}</span>
          </div>

          {roomy && (
            <div className="wv-switch" role="group" aria-label="Устройство">
              {(['desktop', 'phone'] as const).map((d) => (
                <button key={d} type="button" aria-pressed={device === d} data-cursor="none" onClick={() => pickDevice(d)}>
                  {d === 'desktop' ? 'компьютер' : 'телефон'}
                </button>
              ))}
            </div>
          )}

          <div className="wv-actions">
            {work.tour.length > 0 && (
              <button type="button" className="wv-mode" aria-pressed={tour} data-cursor="none" onClick={toggleTour}>
                Разбор
              </button>
            )}
            <button type="button" className="wv-icon" aria-label="Предыдущая работа" data-cursor="none" onClick={() => go(-1)}>
              ←
            </button>
            <button type="button" className="wv-icon" aria-label="Следующая работа" data-cursor="none" onClick={() => go(1)}>
              →
            </button>
            <a className="wv-link max-md:hidden" href={work.url} target="_blank" rel="noopener noreferrer" data-cursor="none">
              Открыть в новой вкладке
            </a>
            <span className="max-md:hidden">
              <Button size="sm" href={telegramLink(`Хочу сайт как ${work.title}`)} target="_blank">
                Хочу такой же
              </Button>
            </span>
            <button ref={closeBtn} type="button" className="wv-icon wv-close" aria-label="Закрыть просмотр" data-cursor="none" onClick={close}>
              ✕
            </button>
          </div>
        </header>

        <div className="wv-stage">
          <div ref={flip} className="wv-flip">
            <motion.div layout className="wv-frame" data-device={asPhone ? 'phone' : 'desktop'} style={frameStyle} transition={SPRING}>
              {!asPhone && (
                <div className="wk-chrome" aria-hidden="true">
                  <span className="wk-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="wk-address">{work.title}</span>
                </div>
              )}
              <div className="wv-screen" data-loaded={loaded} data-tour={tour}>
                {tour && <WorkTour work={work} />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`cover-${work.id}-${asPhone}`}
                  className="wv-cover"
                  src={asset(asPhone || !roomy ? work.coverMobile : work.cover)}
                  alt=""
                  draggable={false}
                />
                <iframe
                  key={`live-${work.id}-${asPhone}`}
                  className="wv-live"
                  src={work.url}
                  title={`Демо: ${work.title}`}
                  loading="lazy"
                  sandbox={IFRAME_SANDBOX}
                  onLoad={() => setLoaded(true)}
                  style={
                    asPhone
                      ? { width: PHONE.width, height: PHONE.height, transform: `scale(${phoneScale})` }
                      : undefined
                  }
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* На телефоне действия стоят внизу */}
        <footer className="wv-foot">
          <a className="wv-link" href={work.url} target="_blank" rel="noopener noreferrer">
            В новой вкладке
          </a>
          <Button size="sm" href={telegramLink(`Хочу сайт как ${work.title}`)} target="_blank">
            Хочу такой же
          </Button>
        </footer>
      </div>
    </MotionConfig>
  );
}
