import type { Metadata } from 'next';
import {
  Cormorant_Garamond,
  Cormorant_SC,
  Lora,
  Playfair_Display,
  Spectral,
  Homemade_Apple,
} from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GrainOverlay from '@/components/GrainOverlay';
import TimeOfDay from '@/components/TimeOfDay';
import ClientShell from '@/components/ClientShell';
import YandexMetrika from '@/components/YandexMetrika';

const cormorant = Cormorant_Garamond({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const cormorantSC = Cormorant_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant-sc',
  display: 'swap',
});

const lora = Lora({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
});

const homemadeApple = Homemade_Apple({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-homemade-apple',
  display: 'swap',
});

const TITLE       = 'Долина элегий — радио, истории и музыка';
const DESCRIPTION = 'Маленькая деревушка мышей, где обычная жизнь оказывается чудом, стоит лишь прислушаться.';

export const metadata: Metadata = {
  metadataBase: new URL('https://valleyofelegies.com'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type:        'website',
    url:         'https://valleyofelegies.com',
    title:       TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
    description: DESCRIPTION,
    images:      ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontClasses = [
    cormorant.variable,
    cormorantSC.variable,
    lora.variable,
    playfair.variable,
    spectral.variable,
    homemadeApple.variable,
  ].join(' ');

  return (
    <html lang="ru" className={`${fontClasses} font-classical`}>
      <head>
        {/* Яндекс.Метрика — счётчик 110015216 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=110015216','ym');ym(110015216,'init',{ssr:true,webvisor:true,clickmap:true,accurateTrackBounce:true,trackLinks:true});`,
          }}
        />
        {/* Предзагрузка звуков окна — к первому клику файлы уже в кэше */}
        <link rel="preload" href="/audio/sounds/Opening-window.mp3" as="audio" type="audio/mpeg" />
        <link rel="preload" href="/audio/sounds/Closing-window.mp3" as="audio" type="audio/mpeg" />
        {/* Без JavaScript [data-intro] элементы всегда видны */}
        <noscript><style>{`[data-intro],[data-letter]{opacity:1!important}`}</style></noscript>
      </head>
      <body>
        {/* Яндекс.Метрика: пиксель для случая без JS + отслеживание SPA-переходов */}
        <noscript>
          <div><img src="https://mc.yandex.ru/watch/110015216" style={{ position: 'absolute', left: '-9999px' }} alt="" /></div>
        </noscript>
        <YandexMetrika />
        <TimeOfDay />
        <GrainOverlay />
        <ClientShell>
          <Header />
          <main>{children}</main>
          <Footer />
        </ClientShell>
      </body>
    </html>
  );
}
