'use client';

import { useEffect } from 'react';

function autoTimeOfDay(): 'day' | 'night' {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day' : 'night';
}

export default function TimeOfDay() {
  useEffect(() => {
    const html = document.documentElement;
    const apply = (tod: string) => {
      html.classList.remove('tod-dawn', 'tod-day', 'tod-dusk', 'tod-night');
      html.classList.add('tod-' + tod);
    };

    apply(autoTimeOfDay());

    const id = setInterval(() => {
      apply(autoTimeOfDay());
    }, 60000);

    return () => clearInterval(id);
  }, []);

  return null;
}
