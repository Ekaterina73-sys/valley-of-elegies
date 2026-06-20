'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const COUNTER_ID = 110015216;

/**
 * Отслеживание переходов в SPA: при смене страницы шлём 'hit' в Метрику.
 * Первый просмотр уже учтён в init (код в <head>), поэтому его пропускаем,
 * иначе главная считалась бы дважды.
 */
export default function YandexMetrika() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const ym = (window as unknown as {
      ym?: (id: number, action: string, url: string) => void;
    }).ym;
    if (typeof ym === 'function') ym(COUNTER_ID, 'hit', window.location.href);
  }, [pathname]);

  return null;
}
