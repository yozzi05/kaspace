/** Блокировка прокрутки страницы, пока открыт полноэкранный слой. */
let locks = 0;

export function lockScroll() {
  locks += 1;
  if (locks === 1) document.documentElement.classList.add('scroll-locked');
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) document.documentElement.classList.remove('scroll-locked');
}
