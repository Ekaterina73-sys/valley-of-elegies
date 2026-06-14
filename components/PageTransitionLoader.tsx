'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import styles from './PageTransitionLoader.module.css';

// Show loader only if navigation takes longer than this
const SHOW_AFTER_MS = 300;
// How long to wait for React to settle before first image scan
const SETTLE_MS     = 250;
// Poll interval while waiting for images
const POLL_MS       = 200;
// Hard cap — dismiss no matter what
const MAX_WAIT_MS   = 20_000;

/**
 * Returns images inside <main> that are still loading AND
 * are close enough to the viewport that the browser has
 * actually started fetching them.
 */
function pendingImages(): HTMLImageElement[] {
  const scope = document.querySelector('main') ?? document;
  const vh    = window.innerHeight;
  return Array.from(
    scope.querySelectorAll<HTMLImageElement>('img')
  ).filter(img => {
    if (img.complete) return false;
    if (!img.src && !img.srcset) return false;
    // Ignore lazy images far below the fold — they haven't started loading
    const top = img.getBoundingClientRect().top;
    return top < vh * 3;
  });
}

function Inner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [fading,  setFading]  = useState(false);
  const isFirstRef   = useRef(true);
  const cancelledRef = useRef(false);
  // Keep a stable ref to the fade-out timer so cleanup can clear it
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip initial mount — initial load is handled by LoaderSpark
    if (isFirstRef.current) { isFirstRef.current = false; return; }

    cancelledRef.current = false;
    let shown     = false;
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let maxTimer:  ReturnType<typeof setTimeout>  | null = null;

    const dismiss = () => {
      if (showTimer) { clearTimeout(showTimer);  showTimer = null; }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (maxTimer)  { clearTimeout(maxTimer);   maxTimer  = null; }
      cancelledRef.current = true;
      if (!shown) return; // never appeared — nothing to hide
      setFading(true);
      fadeTimerRef.current = setTimeout(() => setVisible(false), 420);
    };

    // Show the overlay after SHOW_AFTER_MS if we haven't dismissed yet
    showTimer = setTimeout(() => {
      if (cancelledRef.current) return;
      shown = true;
      setFading(false);
      setVisible(true);
    }, SHOW_AFTER_MS);

    // Wait for React to settle, then start polling
    const settleTimer = setTimeout(() => {
      if (cancelledRef.current) return;

      const check = () => {
        if (cancelledRef.current) return;
        if (pendingImages().length === 0) dismiss();
      };

      check(); // immediate check after settle

      if (!cancelledRef.current) {
        pollTimer = setInterval(check, POLL_MS);
        maxTimer  = setTimeout(dismiss, MAX_WAIT_MS);
      }
    }, SETTLE_MS);

    return () => {
      cancelledRef.current = true;
      clearTimeout(settleTimer);
      if (showTimer) clearTimeout(showTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (maxTimer)  clearTimeout(maxTimer);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
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
