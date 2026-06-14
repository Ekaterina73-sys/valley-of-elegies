'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { PlayerProvider } from './PlayerStore';
import StickyPlayer from './StickyPlayer';
import SoundControl from './SoundControl';
import { soundStore } from '@/lib/soundStore';

// Только клиент, без SSR — загрузчики нужны исключительно в браузере
const LoaderSpark          = dynamic(() => import('./LoaderSpark'),          { ssr: false });
const PageTransitionLoader = dynamic(() => import('./PageTransitionLoader'), { ssr: false });

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [soundOn, setSoundOn] = useState(true);
  const [vol, setVol] = useState(75);

  // Синхронизируем состояние тумблера → мастер-громкость
  useEffect(() => {
    soundStore.setMuted(!soundOn);
  }, [soundOn]);

  useEffect(() => {
    soundStore.setVolume(vol / 100);
  }, [vol]);

  return (
    <PlayerProvider>
      <LoaderSpark />
      <PageTransitionLoader />
      {children}
      <StickyPlayer />
      <SoundControl
        on={soundOn}
        vol={vol}
        onToggle={() => setSoundOn(v => !v)}
        onVol={setVol}
      />
    </PlayerProvider>
  );
}
