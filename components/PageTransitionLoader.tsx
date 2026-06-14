'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import styles from './PageTransitionLoader.module.css';

const SHOW_AFTER_MS = 250;  // Не мигаем при быстрой загрузке
const MAX_WAIT_MS   = 10_000; // Максимум ждём 10 секунд

function Inner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [fading,  setFading]  = useState(false);
  const isFirstRef  = useRef(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    // Пропускаем первый рендер — начальную загрузку ведёт LoaderSpark
    if (isFirstRef.current) { isFirstRef.current = false; return; }

    cancelledRef.current = false;
    let shown     = false;
    let showTimer: ReturnType<typeof setTimeout> | null = null;

    const show = () => {
      if (cancelledRef.current) return;
      shown = true;
      setFading(false);
      setVisible(true);
    };

    const hide = () => {
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      cancelledRef.current = true;
      if (!shown) return;
      setFading(true);
      setTimeout(() => setVisible(false), 420);
    };

    showTimer = setTimeout(show, SHOW_AFTER_MS);

    // Два кадра — даём React закоммитить DOM новой страницы
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cancelledRef.current) return;

      const imgs    = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
      const pending = imgs.filter(img => !img.complete);

      if (pending.length === 0) { hide(); return; }

      const loaded = pending.map(img =>
        new Promise<void>(res => {
          img.addEventListener('load',  () => res(), { once: true });
          img.addEventListener('error', () => res(), { once: true });
        })
      );

      Promise.race([
        Promise.all(loaded),
        new Promise<void>(res => setTimeout(res, MAX_WAIT_MS)),
      ]).then(hide);
    }));

    return () => {
      cancelledRef.current = true;
      if (showTimer) clearTimeout(showTimer);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={`${styles.overlay}${fading ? ` ${styles.fading}` : ''}`}
      aria-hidden="true"
    >
      <span className={styles.star}>✦</span>
    </div>
  );
}

export default function PageTransitionLoader() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
