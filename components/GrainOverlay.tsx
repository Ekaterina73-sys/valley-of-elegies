'use client';

import { useEffect } from 'react';

export default function GrainOverlay() {
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--kb-grain',
      'url("/images/grain-paper.png")'
    );
  }, []);

  return null;
}
