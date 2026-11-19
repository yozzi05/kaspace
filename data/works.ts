import { DEMOS } from './demos.ts';
import type { DemoStep } from './demos.ts';

export type WorkCategory = 'Логистика' | 'Спорт' | 'Животные' | 'Медицина';

/** Запись одного сценария в одном размере. */
export type DemoMedia = {
  mp4: string;
  webm: string;
  /** Первый кадр клипа. */
  poster: string;
  duration: number;
  /** Подписи шагов: at — секунда появления. */
  steps: readonly DemoStep[];
};

/** Мини-демо функции: запись реального сценария на сайте (снимает scripts/demos.ts). */
export type Demo = {
  id: string;
  /** Название функции для чипа. */
  label: string;
  desk: DemoMedia; // 1280×800
  mob: DemoMedia; // 390×844
};

/** Точка «Разбора» на длинном скриншоте: x и y в процентах его ширины и высоты. */
export type TourPoint = { x: number; y: number; text: string };

/*
 * Пометки сверены с реальными страницами (ширина 1440): в тексте только то, что на странице есть.
 * Положение точек снимал разведчик по тем же страницам, что и длинные скриншоты.
 */
const TOURS: Record<string, readonly TourPoint[]> = {
  g17: [
    { x: 22, y: 7.3, text: 'Оффер с ценой и сроком прямо в заголовке: от 1 $/кг за 15 дней' },
    { x: 30, y: 28.5, text: 'Маршрут груза по шагам: от заказа у поставщика до двери клиента' },
    { x: 73, y: 57, text: 'Калькулятор доставки: вес, объём и категория сразу дают цену' },
  ],
  padel61: [
    { x: 84, y: 16.5, text: 'Блок «Корты сейчас»: бронь начинается с главной страницы' },
    { x: 84, y: 37.2, text: 'Заявки «Ищут игроков»: присоединиться можно тут же' },
    { x: 22, y: 44.5, text: 'Рейтинг клуба вынесен на главную' },
  ],
  padel63: [
    { x: 82, y: 19, text: 'Блок «Корты сейчас» с кнопкой «Выбрать время» у каждого корта' },
    { x: 20, y: 51.5, text: 'Обучение с нуля отдельной карточкой с записью' },
    { x: 24, y: 66.3, text: 'Рейтинг лиги прямо на главной' },
  ],
  'dental-market': [
    { x: 32, y: 22.6, text: 'Поиск по названию, размеру или артикулу в первом экране' },
    { x: 58, y: 57, text: 'Акционные комплекты с кнопкой «В корзину»' },
    { x: 50, y: 72, text: 'Каталог по системам с числом позиций в каждой' },
  ],
  pronine: [
    { x: 40, y: 27, text: 'Каталог из четырёх моделей с фильтром по уровню игры' },
    { x: 70, y: 35.5, text: 'Подбор ракетки за три вопроса: опыт, стиль, баланс' },
    { x: 26, y: 75, text: 'Проба ракетки до покупки: карта падел-клубов' },
  ],
  groomchik: [
    { x: 22, y: 8.2, text: 'Подбор ухода с первого экрана: адрес салона и вид питомца' },
    { x: 78, y: 22.5, text: 'У каждой услуги своя кнопка «Выбрать»' },
    { x: 20, y: 70.5, text: 'Личный кабинет для постоянных клиентов' },
  ],
  enzoo: [
    { x: 28, y: 6, text: '«Круглосуточно» в заголовке, запись и телефон сразу под ним' },
    { x: 50, y: 61.8, text: 'Три шага до визита: связаться, согласовать, приехать' },
    { x: 66, y: 67.4, text: 'Отдельный блок с ценами на услуги' },
  ],
  integral: [
    { x: 20, y: 8.6, text: 'Бесплатная пробная тренировка в первом экране' },
    { x: 40, y: 47.2, text: 'Цены на занятия по группам' },
    { x: 28, y: 59.2, text: 'Пять площадок с адресами и станциями метро' },
  ],
};

/** Скриншоты старых сайтов для шторки «было / стало». Нет скриншота — нет шторки. */
const BEFORE: Record<string, string> = {
  g17: '/works/before/g17.webp',
};

function demosOf(workId: string): Demo[] {
  return (DEMOS[workId] ?? []).map((d) => {
    const media = (key: 'desk' | 'mob'): DemoMedia => {
      // если клип в каком-то размере не записан, берётся второй размер
      const k = d.steps[key] ? key : key === 'desk' ? 'mob' : 'desk';
      const base = `/works/demos/${workId}/${d.id}-${k}`;
      return { mp4: `${base}.mp4`, webm: `${base}.webm`, poster: `${base}.webp`, duration: d.duration[k] ?? 0, steps: d.steps[k] ?? [] };
    };
    return { id: d.id, label: d.label, desk: media('desk'), mob: media('mob') };
  });
}

export type Work = {
  id: string;
  title: string;
  category: WorkCategory;
  /** Ниша, как она показывается в подписи. */
  niche: string;
  url: string;
  /** Крупная работа: стоит в верхней ленте, в карточке идут записи функций. */
  featured: boolean;
  /** Мини-демо функций; у работ из сетки пусто. */
  demos: readonly Demo[];
  /** Три точки «Разбора» на длинном скриншоте. */
  tour: readonly TourPoint[];
  /** Первый экран старого сайта для шторки «было / стало». */
  before?: string;
  tags: readonly string[];
  /** Картинки снимает scripts/shots.ts. Пути от корня сайта. */
  long: string; // вся страница, ширина 1440
  cover: string; // заставка карточки 960×1600
  coverMobile: string; // первый экран на телефоне
};

const work = (
  id: string,
  title: string,
  category: WorkCategory,
  about: string,
  url: string,
  tags: readonly string[],
  featured = false,
): Work => ({
  id,
  title,
  category,
  niche: `${category}: ${about}`,
  url,
  featured,
  demos: featured ? demosOf(id) : [],
  tour: TOURS[id] ?? [],
  before: BEFORE[id],
  tags,
  long: `/works/${id}-long.webp`,
  cover: `/works/${id}-cover.webp`,
  coverMobile: `/works/${id}-cover-m.webp`,
});

export const WORKS: readonly Work[] = [
  work(
    'g17',
    'G17',
    'Логистика',
    'доставка из Китая',
    'https://yozzi05.github.io/gasanov-china/',
    ['калькулятор тарифов', 'маршрут доставки'],
    true,
  ),
  work(
    'padel61',
    'Padel 61',
    'Спорт',
    'падел-клуб',
    'https://yozzi05.github.io/padel61-demo/',
    ['бронь корта', 'рейтинг игроков', 'поиск игры'],
    true,
  ),
  work(
    'padel63',
    'Padel63',
    'Спорт',
    'падел-клуб',
    'https://yozzi05.github.io/padel63',
    ['бронирование корта', 'рейтинг лиги'],
    true,
  ),
  work(
    'dental-market',
    'Dental Market',
    'Медицина',
    'онлайн-каталог имплантов',
    'https://yusifchatgpt-web.github.io/osstem-catalog/',
    ['поиск по артикулу', 'заявка из каталога'],
    true,
  ),

  /* Ниже сеткой */
  work('pronine', 'PRONINE', 'Спорт', 'магазин ракеток для падела', 'https://yozzi05.github.io/pronine-concept/', [
    'подбор ракетки',
    'каталог',
  ]),
  work('groomchik', 'ГрумЧик', 'Животные', 'груминг-салон', 'https://yozzi05.github.io/groomchik-demo/', [
    'онлайн-запись',
    'личный кабинет',
  ]),
  work('enzoo', 'EnZoo', 'Медицина', 'ветклиника', 'https://yozzi05.github.io/enzoo-site', [
    'запись на приём',
    'цены на услуги',
  ]),
  work(
    'integral',
    'Интеграл',
    'Спорт',
    'детская футбольная школа',
    'https://yozzi05.github.io/integral-football-demo-slab/',
    ['пробная тренировка', 'адреса площадок'],
  ),
];

export const WORK_FILTERS = ['Все', 'Спорт', 'Животные', 'Медицина', 'Логистика'] as const;
export type WorkFilter = (typeof WORK_FILTERS)[number];

/** Якорь работы в разделе «Работы». */
export const workAnchor = (id: string) => `#work-${id}`;
