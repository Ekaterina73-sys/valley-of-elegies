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

export const metadata: Metadata = {
  title: 'Долина элегий',
  description: 'Тихое место, где живут мыши: пекут пироги, навещают друг друга без повода и подолгу смотрят на закат.',
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
      </body>
    </html>
  );
}
