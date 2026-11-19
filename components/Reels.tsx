'use client';

import { useEffect, useRef, useState } from 'react';
import { REELS } from '@/data/reels';
import { asset } from '@/lib/asset';
import { useInView } from '@/lib/useInView';
import { useReducedMotion } from '@/lib/useMedia';
import { LogoMark } from './Logo';
import { SectionTitle } from './SectionTitle';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Ролики: горизонтальная лента вертикальных видео в рамках телефона.
 * Ролик в центре ленты играет без звука, нажатие включает звук.
 * Нажатие на соседний ролик выводит его в центр.
 */
export function Reels() {
  const reduced = useReducedMotion();
  const [introRef, seen] = useInView<HTMLDivElement>();
  const strip = useRef<HTMLUListElement>(null);
  const videos = useRef(new Map<string, HTMLVideoElement>());

  const [center, setCenter] = useState(0);
  const [visible, setVisible] = useState(false);
  const [sound, setSound] = useState(false);
  const [manual, setManual] = useState(false); // «меньше движения»: запуск только по нажатию
  const [failed, setFailed] = useState<readonly string[]>([]);

  /* Какой ролик сейчас в центре ленты */
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      [...el.children].forEach((li, i) => {
        const r = li.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      setCenter(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* Видео играет, только пока лента на экране */
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    REELS.forEach((reel, i) => {
      const v = videos.current.get(reel.id);
      if (!v) return;
      if (i === center && visible && (!reduced || manual)) {
        v.muted = !sound;
        v.play().catch(() => {});
      } else {
        v.pause();
        v.muted = true;
      }
    });
  }, [center, visible, sound, reduced, manual]);

  /* Ушли с ленты или сменили ролик: звук выключается */
  useEffect(() => {
    if (!visible) setSound(false);
  }, [visible]);

  const onPick = (i: number) => {
    const el = strip.current;
    if (i !== center && el) {
      const li = el.children[i] as HTMLElement;
      el.scrollTo({ left: li.offsetLeft - (el.clientWidth - li.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
      setSound(false);
      return;
    }
    if (reduced && !manual) setManual(true);
    else setSound((s) => !s);
  };

  return (
    <section id="reels" className="rl">
      <div className="rl-head">
        <SectionTitle text="РОЛИКИ" />
        <div ref={introRef} data-ready={seen}>
          <p className="reveal wk-sub">Анимация для соцсетей и рекламы. Сценарий, графика и звук под ключ.</p>
        </div>
      </div>

      <ul ref={strip} className="rl-strip">
        {REELS.map((reel, i) => {
          const isCenter = i === center;
          const broken = failed.includes(reel.id);
          const action = !isCenter ? 'Показать ролик' : sound ? 'Выключить звук' : 'Включить звук';
          return (
            <li key={reel.id} className="rl-item" data-center={isCenter}>
              <button
                type="button"
                className="rl-phone"
                aria-label={`${reel.title}. ${action}`}
                data-cursor={isCenter ? (sound ? 'выключить звук' : 'включить звук') : 'none'}
                onClick={() => onPick(i)}
              >
                {broken ? (
                  <span className="rl-empty">
                    <LogoMark className="h-12 w-auto text-paper" still />
                  </span>
                ) : (
                  <video
                    ref={(el) => {
                      if (el) videos.current.set(reel.id, el);
                      else videos.current.delete(reel.id);
                    }}
                    className="rl-video"
                    src={asset(reel.src)}
                    poster={reel.poster ? asset(reel.poster) : undefined}
                    muted
                    loop
                    playsInline
                    preload="none"
                    onError={() => setFailed((f) => (f.includes(reel.id) ? f : [...f, reel.id]))}
                  />
                )}
                <span className="rl-sound" data-on={isCenter && sound} aria-hidden="true">
                  {isCenter && sound ? 'звук вкл' : 'звук выкл'}
                </span>
              </button>
              <p className="rl-caption">
                <span className="rl-count">
                  {pad(i + 1)} / {pad(REELS.length)}
                </span>
                {reel.title}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
