'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useReducedMotion } from '@/lib/useMedia';

gsap.registerPlugin(ScrollTrigger);

/** Плавная прокрутка Lenis на одном тикере с GSAP. Выключена при prefers-reduced-motion. */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  /* Шрифты меняют высоту блоков: после их загрузки сцены по прокрутке пересчитываются */
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({ autoRaf: false, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
