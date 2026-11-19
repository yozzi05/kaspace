import { Calculator } from '@/components/Calculator';
import { Facts } from '@/components/Facts';
import { Faq } from '@/components/Faq';
import { FinalCta } from '@/components/FinalCta';
import { Footer } from '@/components/Footer';
import { Process } from '@/components/Process';
import { Reels } from '@/components/Reels';
import { Header } from '@/components/Header';
import { Services } from '@/components/Services';
import { Works } from '@/components/works/Works';
import { Hero } from '@/components/Hero';
import { Intro } from '@/components/Intro';
import { INTRO_GUARD } from '@/lib/introGuard';

const NO_JS = `.intro{display:none!important}.reveal,.typed-rest,.hero-word,.hero-gap{opacity:1!important;transform:none!important}`;

/* Разметка Organization для поисковиков: телефон и Telegram */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/` : undefined;
const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'kaspace',
  description: 'Веб-агентство: сайты, приложения, ИИ-автоматизация, ролики',
  ...(SITE ? { url: SITE, logo: `${SITE}og.png` } : {}),
  telephone: '+79280647665',
  sameAs: ['https://t.me/yusifkas'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    telephone: '+79280647665',
    url: 'https://t.me/yusifkas',
    availableLanguage: 'Russian',
  },
};

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_GUARD }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }} />
      <noscript>
        <style>{NO_JS}</style>
      </noscript>
      <Intro />
      <Header />
      <main>
        <Hero />

        <Facts />
        <Services />
        <Works />
        <Reels />
        <Process />
        <Calculator />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
