import type { Metadata } from 'next';
import {
  Cormorant_Garamond,
  Cormorant_SC,
  Lora,
  Playfair_Display,
  Spectral,
  Homemade_Apple,
} from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GrainOverlay from '@/components/GrainOverlay';
import TimeOfDay from '@/components/TimeOfDay';
import ClientShell from '@/components/ClientShell';

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
        {/* Предзагрузка звуков окна — к первому клику файлы уже в кэше */}
        <link rel="preload" href="/audio/sounds/Opening-window.mp3" as="audio" type="audio/mpeg" />
        <link rel="preload" href="/audio/sounds/Closing-window.mp3" as="audio" type="audio/mpeg" />
        {/* Без JavaScript [data-intro] элементы всегда видны */}
        <noscript><style>{`[data-intro],[data-letter]{opacity:1!important}`}</style></noscript>
      </head>
      <body>
        <TimeOfDay />
        <GrainOverlay />
        <ClientShell>
          <Header />
          <main>{children}</main>
          <Footer />
        </ClientShell>
        <Analytics />
      </body>
    </html>
  );
}
