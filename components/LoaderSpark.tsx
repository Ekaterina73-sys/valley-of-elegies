'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './LoaderSpark.module.css';

/** Флаг уровня модуля — не повторяем при SPA-навигации */
let _done = false;

// Тайминги (мс)
const T_IGNITE = 1400;   // Зарождение — искра медленно вырастает
const T_MIN    = 2800;   // Минимум до угасания
const T_SHRINK =  600;   // Угасание — сжимается в точку
const T_FADE   = 1000;   // Оверлей тает как утренний туман

export default function LoaderSpark() {
  const [show, setShow]     = useState(!_done);
  const [fading, setFading] = useState(false);
  const sparkRef            = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (_done) { setShow(false); return; }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      _done = true;
      document.body.classList.add('kb-intro-ready');
      setShow(false);
      return;
    }

    let fontsOk        = false;
    let imageOk        = false;
    let minTimeOk      = false;
    let shrinkLaunched = false;

    const tryShrink = () => {
      if (fontsOk && imageOk && minTimeOk && !shrinkLaunched) {
        shrinkLaunched = true;
        doShrink();
      }
    };

    // Предзагрузка пейзажа
    const html    = document.documentElement;
    const isNight = html.classList.contains('tod-night') ||
                    html.classList.contains('tod-dusk');
    const img = new Image();
    img.onload = img.onerror = () => { imageOk = true; tryShrink(); };
    img.src = isNight ? '/images/window-night.jpg' : '/images/window-day.jpg';
    if (img.complete) imageOk = true;

    document.fonts.ready.then(() => { fontsOk = true; tryShrink(); });
    setTimeout(() => { minTimeOk = true; tryShrink(); }, T_MIN);

    // Такт 1: зарождение — растёт из точки
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sparkRef.current?.classList.add(styles.sparkLit);
      });
    });

    // Такт 1b: дыхание — добавляется после завершения зарождения
    const breathTimer = window.setTimeout(() => {
      sparkRef.current?.classList.add(styles.sparkBreathing);
    }, T_IGNITE + 60);

    // Такт 2: угасание — сжимается в точку
    function doShrink() {
      clearTimeout(breathTimer);
      const el = sparkRef.current;
      if (!el) { finish(); return; }

      // Фиксируем состояние перед угасанием
      el.style.animation  = 'none';
      el.getBoundingClientRect(); // reflow

      el.style.transition = [
        `transform   ${T_SHRINK}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        `opacity     ${T_SHRINK}ms ease-in`,
        `text-shadow ${Math.round(T_SHRINK * 0.55)}ms ease-in`,
      ].join(', ');
      el.style.transform  = 'translate(-50%, -50%) scale(0.05)';
      el.style.opacity    = '0';
      el.style.textShadow = 'none';

      setTimeout(finish, T_SHRINK);
    }

    // Такт 3: оверлей тает, мир появляется
    function finish() {
      _done = true;
      document.body.classList.add('kb-intro-ready');
      setFading(true);
      setTimeout(() => setShow(false), T_FADE + 60);
    }

    return () => clearTimeout(breathTimer);
  }, []);

  if (!show) return null;

  return (
    <div
      className={`${styles.overlay}${fading ? ` ${styles.overlayFading}` : ''}`}
      aria-hidden="true"
    >
      <span ref={sparkRef} className={styles.spark} aria-hidden="true">✦</span>
    </div>
  );
}
