import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Button } from '@/components/Button';
import { LogoBadge, LogoMark } from '@/components/Logo';
import { Wordmark } from '@/components/Wordmark';

export const metadata: Metadata = {
  title: 'kaspace · UI',
  robots: { index: false, follow: false },
};

const COLORS = [
  { token: 'ink', value: '#0A1122', where: 'основной фон', bg: '#0A1122' },
  { token: 'ink-2', value: '#121C36', where: 'центр градиента, карточки', bg: '#121C36' },
  { token: 'ink-3', value: '#060B17', where: 'края градиента, подвал', bg: '#060B17' },
  { token: 'paper', value: '#F0EEE8', where: 'текст, светлые плашки', bg: '#F0EEE8' },
  { token: 'paper-dim', value: 'rgba(240,238,232,.62)', where: 'второстепенный текст', bg: 'rgba(240,238,232,.62)' },
  { token: 'accent', value: '#3DB8FF', where: 'акцент на тёмном', bg: '#3DB8FF' },
  { token: 'accent-deep', value: '#1E86EA', where: 'акцент на светлом', bg: '#1E86EA' },
  { token: 'line', value: 'rgba(240,238,232,.14)', where: 'тонкие линии, направляющие', bg: 'rgba(240,238,232,.14)' },
];

function Section({ n, title, note, children }: { n: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-16 md:py-24">
      <div className="mb-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 md:mb-14">
        <span className="label-mono text-accent">{n} / 07</span>
        <h2 className="h-display text-[clamp(28px,4.4vw,56px)] uppercase">{title}</h2>
        {note && <p className="basis-full text-paper-dim md:text-[17px] lg:pr-[40%]">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Spec({ children }: { children: ReactNode }) {
  return <p className="label-mono mt-4 text-paper-dim">{children}</p>;
}

export default function UiPage() {
  return (
    <main className="mx-auto w-full max-w-[1320px] px-5 pb-32 sm:px-8 lg:px-12">
      <header className="flex flex-wrap items-end justify-between gap-6 py-10 md:py-14">
        <div className="flex items-center gap-4">
          <LogoBadge size={44} />
          <Wordmark className="text-[34px]" />
        </div>
        <p className="label-mono text-paper-dim">Этап 1 · основа · служебная страница</p>
      </header>

      {/* 01 Цвета */}
      <Section n="01" title="Цвета">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
          {COLORS.map((c) => (
            <li key={c.token}>
              <div className="h-24 border border-line md:h-32" style={{ background: c.bg }} />
              <p className="mt-3 font-display text-[19px] font-bold tracking-tight">{c.token}</p>
              <p className="label-mono mt-1 !tracking-[.12em] text-paper-dim">{c.value}</p>
              <p className="mt-1 text-[14px] text-paper-dim">{c.where}</p>
            </li>
          ))}
        </ul>
        <div
          className="mt-10 grid h-40 place-items-center border border-line md:h-56"
          style={{ background: 'radial-gradient(120% 90% at 50% 45%, #121C36 0%, #0A1122 55%, #060B17 100%)' }}
        >
          <span className="label-mono text-paper-dim">Фон страницы · радиальный градиент</span>
        </div>
      </Section>

      {/* 02 Шрифты */}
      <Section n="02" title="Шрифты">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-16">
          <div>
            <Wordmark className="text-[clamp(64px,11vw,150px)]" />
            <Spec>Название · Familjen Grotesk 700 · строчные</Spec>
          </div>
          <div>
            <p className="h-display text-[clamp(34px,5.2vw,68px)] uppercase">Что можно заказать</p>
            <Spec>Заголовок раздела · Inter Tight 800 · −0.03em · заглавные</Spec>
            <p className="mt-8 font-display text-[clamp(24px,3vw,38px)] leading-[1.08] font-bold tracking-[-0.03em]">
              Сайты, приложения и ИИ-автоматизация под задачу бизнеса
            </p>
            <Spec>Заголовок · Inter Tight 700 · −0.03em</Spec>
          </div>
          <div>
            <p className="max-w-[52ch] text-[18px]">
              Кастомный код без конструкторов. До оплаты вы получаете бесплатное демо первого экрана под вашу нишу.
            </p>
            <Spec>Текст · Inter 400 · 18px</Spec>
            <p className="mt-6 max-w-[52ch] text-[14px] font-medium text-paper-dim">
              Точная смета после короткого брифа
            </p>
            <Spec>Второстепенный · Inter 500 · paper-dim · от 14px</Spec>
          </div>
          <div>
            <p className="label-mono">Веб-агентство · Сайты · Приложения · ИИ-автоматизация</p>
            <p className="label-mono mt-4 !text-[14px] text-accent">01 / 07 · X 0120 · Y 0340</p>
            <Spec>Служебные · JetBrains Mono · заглавные · .22em · 12–14px</Spec>
          </div>
        </div>
      </Section>

      {/* 03 Логотип */}
      <Section n="03" title="Логотип">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="grid h-64 place-items-center border border-line bg-ink-2">
            <LogoMark title="kaspace" className="h-28 w-auto text-paper" />
          </div>
          <div className="grid h-64 place-items-center border border-line bg-ink-2">
            <LogoBadge size={132} />
          </div>
          <div className="grid h-64 place-items-center bg-paper text-ink">
            <Wordmark className="text-[64px]" accent="var(--color-accent-deep)" />
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-end gap-8">
          {[96, 64, 44, 32, 20].map((s) => (
            <div key={s} className="flex flex-col items-center gap-3">
              <LogoBadge size={s} still={s <= 32} />
              <span className="label-mono text-paper-dim">{s}</span>
            </div>
          ))}
          <div className="ml-auto flex flex-wrap items-baseline gap-x-10 gap-y-4">
            <Wordmark className="text-[48px]" />
            <Wordmark className="text-[28px]" />
            <Wordmark className="text-[18px]" still />
          </div>
        </div>
        <Spec>Мигание курсора · период 1.2 с · прозрачность 1 → .25 · в мелких размерах курсор статичен</Spec>
      </Section>

      {/* 04 Кнопки */}
      <Section
        n="04"
        title="Кнопки"
        note="Притяжение в радиусе 80px, заливка кругом от точки входа, перепечатка текста, пружина при нажатии, видимый фокус с клавиатуры (Tab)."
      >
        <div className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Button size="lg" hoverLabel="Бесплатно">
              Получить демо
            </Button>
            <Spec>Основная · крупная · перепечатка</Spec>
          </div>
          <div>
            <Button size="lg" variant="outline" cursor="none">
              Смотреть работы
            </Button>
            <Spec>Контурная · крупная</Spec>
          </div>
          <div>
            <Button hoverLabel="Бесплатно">Получить демо бесплатно</Button>
            <Spec>Основная · средняя</Spec>
          </div>
          <div>
            <Button variant="outline" hoverLabel="В Telegram">
              Отправить в Telegram
            </Button>
            <Spec>Контурная · средняя · перепечатка</Spec>
          </div>
          <div>
            <Button size="sm" hoverLabel="Бесплатно">
              Получить демо
            </Button>
            <Spec>Малая · для шапки</Spec>
          </div>
          <div>
            <Button disabled>Получить демо</Button>
            <Spec>Недоступна</Spec>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-8 bg-paper p-8 text-ink md:p-12">
          <p className="max-w-[20ch] font-display text-[clamp(24px,3vw,36px)] leading-[1.05] font-bold tracking-[-0.03em]">
            Кнопка на светлой плашке
          </p>
          <Button size="lg" variant="onpaper" hoverLabel="Бесплатно">
            Получить демо
          </Button>
        </div>
      </Section>

      {/* 05 Свой курсор */}
      <Section
        n="05"
        title="Свой курсор"
        note="Только на устройствах с мышью. Вертикальная синяя полоса, над зонами превращается в пилюлю с подписью."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { kind: 'demo', zone: 'Работы', label: 'смотреть демо' },
            { kind: 'write', zone: 'Кнопки', label: 'написать' },
          ].map((z, i) => (
            <div
              key={z.kind}
              data-cursor={z.kind}
              className="flex h-56 flex-col justify-between border border-line bg-ink-2 p-6"
            >
              <span className="label-mono text-accent">0{i + 1} / 02</span>
              <div>
                <p className="font-display text-[28px] font-bold tracking-[-0.03em]">{z.zone}</p>
                <p className="label-mono mt-2 text-paper-dim">→ «{z.label}»</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="label-mono text-paper-dim">Поле ввода · курсор остаётся полосой</span>
            <input
              type="text"
              placeholder="Ниша или ссылка на сайт"
              className="mt-3 h-14 w-full border-b border-line bg-transparent text-[18px] placeholder:text-paper-dim focus:border-accent focus:outline-none"
            />
          </label>
          <p className="self-end text-paper-dim">
            На сенсорных экранах своего курсора, притяжения кнопок и 3D-наклона нет.
          </p>
        </div>
      </Section>

      {/* 06 Направляющие */}
      <Section
        n="06"
        title="Блоки"
        note="Крупные блоки без рамок-направляющих: фон из точек реагирует на мышь по всей странице."
      >
        <div className="grid gap-16 px-8 py-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="bg-ink-2 p-8 md:p-12">
            <span className="label-mono text-accent">01 / 12</span>
            <p className="h-display mt-6 text-[clamp(30px,4vw,54px)]">Лендинги</p>
            <p className="mt-3 font-display text-[22px] font-bold tracking-[-0.02em]">от 35 000 ₽</p>
            <p className="mt-4 max-w-[44ch] text-paper-dim">
              Одна страница под один оффер: структура, тексты, дизайн, адаптив, форма заявки
            </p>
          </div>
          <div className="grid min-h-56 place-items-center bg-paper text-ink">
            <LogoBadge size={96} className="!bg-ink !text-paper" />
          </div>
        </div>
      </Section>

      {/* 07 Движение */}
      <Section n="07" title="Движение">
        <ul className="grid gap-x-10 gap-y-6 text-[17px] md:grid-cols-2">
          <li className="border-t border-line pt-4">Анимируются только transform и opacity.</li>
          <li className="border-t border-line pt-4">Плавная прокрутка Lenis на одном тикере с GSAP.</li>
          <li className="border-t border-line pt-4">
            prefers-reduced-motion: курсор не мигает, кнопки без притяжения и перепечатки, плавная прокрутка выключена.
          </li>
          <li className="border-t border-line pt-4">Сцены по прокрутке (GSAP ScrollTrigger) подключаются с этапа 2.</li>
        </ul>
      </Section>
    </main>
  );
}
