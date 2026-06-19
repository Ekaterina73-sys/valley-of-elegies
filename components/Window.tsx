'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import styles from './Window.module.css';
import { ambientAudio } from '@/lib/ambientAudio';
import RainCanvas from './RainCanvas';

function Sash({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`${styles.sash} ${side === 'left' ? styles.sashLeft : styles.sashRight}`}>
      <div className={styles.sashGlass}></div>
      <span className={`${styles.rail} ${styles.railTop}`}></span>
      <span className={`${styles.rail} ${styles.railBottom}`}></span>
      <span className={`${styles.rail} ${styles.railOuter}`}></span>
      <span className={`${styles.rail} ${styles.railInner}`}></span>
      <span className={`${styles.muntin} ${styles.muntinV}`}></span>
      <span className={`${styles.muntin} ${styles.muntinH} ${styles.muntinH1}`}></span>
      <span className={`${styles.muntin} ${styles.muntinH} ${styles.muntinH2}`}></span>
      <span className={styles.handle}></span>
    </div>
  );
}

type WindowProps = { className?: string };

export default function Window({ className }: WindowProps) {
  const [ajar, setAjar] = useState(false);

  const rainTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [rainElapsed, setRainElapsed] = useState<number>(-1);
  const [rainKey,     setRainKey]     = useState(0); // increments on each new rain session

  /** true после первого клика пользователя — не запускаем аудио из localStorage */
  const interactedRef = useRef(false);
  /** true во время восстановления open-состояния после навигации — блокирует повторный play() */
  const restoringRef = useRef(false);
  /** Актуальное ajar для event-listener без stale closure */
  const ajarRef = useRef(false);
  /** true когда дождь идёт — для чтения в ajar-эффекте без stale closure */
  const rainActiveRef = useRef(false);
  /** Ref на casement — для заморозки breathing-анимации */
  const casementRef = useRef<HTMLDivElement>(null);
  /**
   * Когда пользователь открывает окно на мобилке, мы замораживаем
   * breathing-анимацию на её текущей позиции, сохраняем sash здесь,
   * а useLayoutEffect убирает инлайн-стили ПОСЛЕ того, как React
   * закоммитил casementAjar — это запускает CSS-переход именно
   * с замороженной позиции, без рывка.
   */
  const pinnedSashRef = useRef<HTMLElement | null>(null);

  // Синхронизируем refs с состоянием
  useEffect(() => { ajarRef.current = ajar; }, [ajar]);
  useEffect(() => { rainActiveRef.current = rainElapsed >= 0; }, [rainElapsed]);

  // Тихо прогреваем амбиент при первом действии на главной — чтобы к клику
  // по окну ~7 МБ звука уже были загружены и фейд начался сразу, без паузы.
  useEffect(() => {
    const events = ['pointerdown', 'touchstart', 'keydown', 'mousemove', 'scroll', 'wheel'] as const;
    const warm = () => {
      ambientAudio.prewarm();
      events.forEach(e => window.removeEventListener(e, warm));
    };
    events.forEach(e => window.addEventListener(e, warm, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, warm));
  }, []);

  // Восстанавливаем визуальное состояние окна после навигации:
  // если аудио уже играет (синглтон жив) — показываем окно открытым без лишних вызовов.
  useEffect(() => {
    if (ambientAudio.isPlaying) {
      restoringRef.current = true; // блокирует audio-вызов в следующем срабатывании ajar-эффекта
      interactedRef.current = true;
      ajarRef.current = true;
      setAjar(true);
    }

    // Восстанавливаем визуал дождя если дождь идёт — компонент размонтировался при навигации,
    // но аудио продолжало играть в синглтоне. Перезапускаем таймер с текущей позиции файла.
    if (ambientAudio.rainActive) {
      const t0 = ambientAudio.rainCurrentTime;
      const startMs = Date.now() - t0 * 1000;
      setRainKey(k => k + 1);
      setRainElapsed(t0);
      if (rainTimerRef.current) clearInterval(rainTimerRef.current);
      rainTimerRef.current = setInterval(() => {
        const t = (Date.now() - startMs) / 1000;
        if (t >= 435) {
          clearInterval(rainTimerRef.current!);
          rainTimerRef.current = null;
          setRainElapsed(-1);
        } else {
          setRainElapsed(t);
        }
      }, 250);
    }

    return () => { restoringRef.current = false; };
  }, []);

  // Управляем амбиентным аудио при изменении ajar
  useEffect(() => {
    if (!interactedRef.current) return;
    if (restoringRef.current) {
      // Только восстанавливаем визуал — аудио уже играет, ничего не трогаем.
      // Сбрасываем флаг только когда ajar=true: первый запуск эффекта при ajar=false
      // (начальное состояние до setState) не должен его поглощать.
      if (ajar) restoringRef.current = false;
      return;
    }
    if (ajar) {
      ambientAudio.playWindowOpen();
      ambientAudio.play();
    } else {
      ambientAudio.playWindowClose();
      if (rainActiveRef.current) {
        ambientAudio.muteForWindow(); // только звук, визуал продолжает цикл
      } else {
        ambientAudio.stop();
      }
    }
  }, [ajar]);

  // Закрываем окно, когда основной плеер начинает играть
  // (амбиент PlayerStore уже остановил напрямую)
  useEffect(() => {
    const onPlayerPlay = () => {
      if (ajarRef.current) setAjar(false);
    };
    window.addEventListener('kb:audio-play', onPlayerPlay);
    return () => window.removeEventListener('kb:audio-play', onPlayerPlay);
  }, []);

  // Запускаем таймер при kb:rain-start, считаем секунды от начала дождя
  useEffect(() => {
    const onStart = () => {
      const startMs = Date.now();
      if (rainTimerRef.current) clearInterval(rainTimerRef.current);
      setRainKey(k => k + 1);
      setRainElapsed(0);
      rainTimerRef.current = setInterval(() => {
        const t = (Date.now() - startMs) / 1000;
        if (t >= 435) {                       // после 7:15 — сбрасываем
          clearInterval(rainTimerRef.current!);
          rainTimerRef.current = null;
          setRainElapsed(-1);
        } else {
          setRainElapsed(t);
        }
      }, 250);
    };
    window.addEventListener('kb:rain-start', onStart);
    return () => {
      window.removeEventListener('kb:rain-start', onStart);
      if (rainTimerRef.current) { clearInterval(rainTimerRef.current); rainTimerRef.current = null; }
    };
  }, []);

  /**
   * useLayoutEffect — ключевой момент мобильного фикса.
   * Срабатывает синхронно ПОСЛЕ коммита DOM (casementAjar уже на элементе),
   * но ДО первого пикселя краски. Убираем инлайн-стили → браузер видит
   * изменение computed-transform с замороженной позиции до -30deg
   * и запускает CSS-переход плавно.
   */
  useLayoutEffect(() => {
    if (pinnedSashRef.current) {
      const sash = pinnedSashRef.current;
      pinnedSashRef.current = null;
      sash.style.transform = '';
      sash.style.animation = '';
    }
  }, [ajar]);

  const toggle = () => {
    interactedRef.current = true;

    // При открытии — замораживаем breathing-анимацию в текущей позиции
    if (!ajar && casementRef.current) {
      const sash = casementRef.current.querySelector(
        `.${styles.sashRight}`
      ) as HTMLElement | null;

      if (sash) {
        const live = getComputedStyle(sash).transform;
        // Останавливаем анимацию и фиксируем её текущую позицию
        sash.style.animation = 'none';
        sash.style.transform = live !== 'none' ? live : 'rotateY(0deg)';
        sash.getBoundingClientRect(); // force reflow — закрепляет стили
        // Сохраняем: useLayoutEffect уберёт инлайн-стили после React-коммита
        pinnedSashRef.current = sash;
      }
    }

    setAjar(a => !a);
  };

  // Похолодание и блюр: 0→1 за 10 с, держится до 7:00, уходит за 10 с
  const rainLightIntensity =
    rainElapsed < 0   ? 0 :
    rainElapsed < 10  ? rainElapsed / 10 :
    rainElapsed < 420 ? 1 :
    rainElapsed < 430 ? (430 - rainElapsed) / 10 : 0;
  const effectiveIntensity = rainLightIntensity;
  const rainBlurPx = effectiveIntensity * 2.5;
  const sceneStyle = rainElapsed >= 0
    ? { filter: `blur(${rainBlurPx.toFixed(1)}px)` }
    : undefined;

  return (
    <div className={`${styles.stage} ${className ?? ''}`}>
      <div className={styles.win3d}>
        <div
          ref={casementRef}
          className={`${styles.casement} ${ajar ? styles.casementAjar : ''}`}
          onClick={toggle}
          role="button"
          aria-pressed={ajar}
          aria-label={ajar ? 'Закрыть окно' : 'Приоткрыть окно'}
          style={{
            '--scene-day': 'url("/images/window-day.jpg")',
            '--scene-night': 'url("/images/window-night.jpg")',
          } as React.CSSProperties}
        >
          <div className={styles.opening}>
            <div className={`${styles.scene} ${styles.sceneDay}`} style={sceneStyle}></div>
            <div className={`${styles.scene} ${styles.sceneNight}`} style={sceneStyle}></div>
            <div
              className={styles.sceneSun}
              style={rainLightIntensity > 0 ? { opacity: Math.max(0, 1 - rainLightIntensity * 1.5) } : undefined}
            ></div>
            <div className={`${styles.firefly} ${styles.firefly0}`}></div>
            <div className={`${styles.firefly} ${styles.firefly1}`}></div>
            <div className={`${styles.firefly} ${styles.firefly2}`}></div>
            <div className={`${styles.firefly} ${styles.firefly3}`}></div>
            <div className={`${styles.firefly} ${styles.firefly4}`}></div>
            {effectiveIntensity > 0.01 && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                  background: 'linear-gradient(180deg, rgba(18,38,82,0.50) 0%, rgba(8,18,52,0.36) 100%)',
                  opacity: effectiveIntensity,
                }}
              />
            )}
            <RainCanvas elapsedSec={rainElapsed} startKey={rainKey} />
          </div>
          <div className={styles.sashes}>
            <Sash side="left" />
            <Sash side="right" />
          </div>
        </div>
        <div className={styles.sill}></div>
        <div className={`${styles.hint} ${ajar ? styles.hintHidden : ''}`}>
          — нажмите, чтобы приоткрыть окно —
        </div>
      </div>
    </div>
  );
}
