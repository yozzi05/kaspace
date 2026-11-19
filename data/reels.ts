export type Reel = {
  id: string;
  title: string;
  /** Вертикальное видео 9:16, путь от корня сайта. Файлы лежат в public/reels/. */
  src: string;
  /** Заставка до запуска (необязательно). */
  poster?: string;
};

/* Чтобы добавить ролик, положите файл в public/reels/ и допишите строку сюда */
export const REELS: readonly Reel[] = [
  { id: 'reel-v4', title: 'Ролик kaspace', src: '/reels/kaspace_reel_v4.mp4' },
  { id: 'pendulum-loop', title: 'Короткая петля', src: '/reels/kaspace_pendulum_loop.mp4' },
];
