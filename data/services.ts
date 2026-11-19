export type Service = {
  id: string;
  title: string;
  /** Минимальная цена в рублях; null, если цена считается после брифа. */
  priceFrom: number | null;
  /** Цена, как она показывается в строке. */
  price: string;
  includes: string;
};

const AFTER_BRIEF = 'цена после брифа';

export const SERVICES: readonly Service[] = [
  {
    id: 'landing',
    title: 'Лендинги',
    priceFrom: 35000,
    price: 'от 35 000 ₽',
    includes: 'Одна страница под один оффер: структура, тексты, дизайн, адаптив, форма заявки',
  },
  {
    id: 'corporate',
    title: 'Корпоративные сайты',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'Многостраничный сайт компании: услуги, кейсы, команда, контакты',
  },
  {
    id: 'shop',
    title: 'Интернет-магазины',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'Каталог, корзина, оплата, личный кабинет',
  },
  {
    id: 'mobile',
    title: 'Мобильные приложения',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'iOS и Android из одной кодовой базы',
  },
  {
    id: 'saas',
    title: 'SaaS-платформы',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'Сервис с подпиской: роли, кабинет, оплата, админка',
  },
  {
    id: 'bots',
    title: 'Telegram-боты',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'Запись, заявки, оплата, уведомления',
  },
  {
    id: 'crm',
    title: 'Интеграции с CRM',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'Заявки с сайта и из бота попадают в CRM сами',
  },
  {
    id: 'redesign',
    title: 'Редизайн',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'Новый сайт на месте старого, с переносом содержимого',
  },
  {
    id: 'logo',
    title: 'Логотип',
    priceFrom: 15000,
    price: 'от 15 000 ₽',
    includes: 'Знак, начертание названия, цвета, правила использования',
  },
  {
    id: 'banners',
    title: 'Баннеры и инфографика',
    priceFrom: 2500,
    price: 'от 2 500 ₽',
    includes: 'Баннеры от 3 000 ₽, инфографика от 2 500 ₽',
  },
  {
    id: 'motion',
    title: 'Ролики и моушн',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'Анимированные ролики для соцсетей и рекламы',
  },
  {
    id: 'ai',
    title: 'ИИ-автоматизация',
    priceFrom: null,
    price: AFTER_BRIEF,
    includes: 'ИИ-ассистенты и сценарии, которые снимают рутину с сотрудников',
  },
];

export const TELEGRAM = 'https://t.me/yusifkas';

/** Ссылка в Telegram с готовым текстом. */
export const telegramLink = (text: string) => `${TELEGRAM}?text=${encodeURIComponent(text)}`;
