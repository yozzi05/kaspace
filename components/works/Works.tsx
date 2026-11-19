'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { WORKS, WORK_FILTERS } from '@/data/works';
import type { Work, WorkFilter } from '@/data/works';
import { useInView } from '@/lib/useInView';
import { useMedia, useReducedMotion } from '@/lib/useMedia';
import { SectionTitle } from '../SectionTitle';
import { BeforeAfter } from './BeforeAfter';
import { DemoCard } from './DemoCard';
import { WorkCard } from './WorkCard';
import { WorkViewer } from './WorkViewer';
import { YourProjectCard } from './YourProjectCard';

gsap.registerPlugin(ScrollTrigger);

const TOTAL = WORKS.length;
const numberOf = (id: string) => WORKS.findIndex((w) => w.id === id) + 1;
const FEATURED = WORKS.filter((w) => w.featured);

/** Верхняя лента крупных работ. На широком экране закреплена и едет вбок от прокрутки. */
function FeaturedStrip({ works, pin, onOpen }: {
  works: readonly Work[];
  pin: boolean;
  onOpen: (id: string) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = strip.current;
    const line = track.current;
    if (!pin || !el || !line) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, line.scrollWidth - el.clientWidth);
      gsap.to(line, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'center center',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          // закрепление добавляет странице высоту: оно пересчитывается раньше сцен, стоящих ниже
          refreshPriority: 1,
        },
      });
    });
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [pin]);

  return (
    // Внешняя обёртка нужна React: ScrollTrigger оборачивает закреплённый блок своим элементом
    <div className="wk-stripwrap">
      <div ref={strip} className="wk-strip" data-pin={pin}>
        <ul ref={track} className="wk-track">
          {works.map((w) => (
            <li key={w.id}>
              {w.demos.length ? (
                <DemoCard work={w} n={numberOf(w.id)} total={TOTAL} />
              ) : (
                <WorkCard work={w} n={numberOf(w.id)} total={TOTAL} onOpen={onOpen} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Works() {
  const reduced = useReducedMotion();
  const desktop = useMedia('(min-width: 1024px)');
  const [introRef, seen] = useInView<HTMLDivElement>();
  const [filter, setFilter] = useState<WorkFilter>('Все');
  const [openId, setOpenId] = useState<string | null>(null);

  const all = filter === 'Все';
  const gridWorks = all ? WORKS.filter((w) => !w.featured) : WORKS.filter((w) => w.category === filter);
  /* Шторка «было / стало»: работы со скриншотом старого сайта, с учётом фильтра */
  const compare = WORKS.filter((w) => w.before && (all || w.category === filter));

  /* После смены фильтра высота страницы другая: сцены по прокрутке пересчитываются */
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 650);
    return () => window.clearTimeout(id);
  }, [filter]);

  return (
    <section id="works" className="wk">
      <div className="wk-head">
        <SectionTitle text="РАБОТЫ, КОТОРЫЕ МОЖНО ПОТРОГАТЬ" />
        <div ref={introRef} data-ready={seen}>
          <p className="reveal wk-sub">
            Каждое демо открывается прямо здесь. Листайте, нажимайте, переключайте на телефон.
          </p>
          <div className="reveal wk-filters" role="group" aria-label="Ниша" style={{ ['--d' as string]: '0.12s' }}>
            {WORK_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className="wk-chip"
                aria-pressed={filter === f}
                data-cursor="none"
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {all && <FeaturedStrip works={FEATURED} pin={desktop && !reduced} onOpen={setOpenId} />}

      <MotionConfig reducedMotion="user">
        <ul className="wk-grid">
          <AnimatePresence mode="popLayout" initial={false}>
            {gridWorks.map((w) => (
              <motion.li
                key={w.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ type: 'spring', duration: 0.6, bounce: 0.12 }}
              >
                <WorkCard work={w} n={numberOf(w.id)} total={TOTAL} onOpen={setOpenId} />
              </motion.li>
            ))}
            {compare.length > 0 && (
              <motion.li
                key="before-after"
                layout
                className="wk-grid-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', duration: 0.6, bounce: 0.12 }}
              >
                <BeforeAfter works={compare} />
              </motion.li>
            )}
            <motion.li key="yours" layout className="wk-grid-wide" transition={{ type: 'spring', duration: 0.6, bounce: 0.12 }}>
              <YourProjectCard />
            </motion.li>
          </AnimatePresence>
        </ul>
      </MotionConfig>

      {openId && <WorkViewer works={WORKS} startId={openId} onClose={() => setOpenId(null)} />}
    </section>
  );
}
