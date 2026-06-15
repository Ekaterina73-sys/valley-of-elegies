'use client';

import { useState, useEffect } from 'react';
import styles from './about.module.css';

export default function AboutClient() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const target = sessionStorage.getItem('kb_scroll');
    if (!target) return;
    sessionStorage.removeItem('kb_scroll');
    const el = document.getElementById(target);
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const data = new FormData();
    data.append('recipient[email]', email);
    data.append('recipient[name]', '');
    try {
      await fetch(
        'https://forms.msndr.net/subscriptions/fec654b58f79240df361c89680391844/form',
        { method: 'POST', body: data, mode: 'no-cors' }
      );
    } catch (_) {}
    setSubscribed(true);
  };

  return (
    <div className={styles.abv}>

      {/* ── Основная рамка: текст о проекте ── */}
      <div className={styles.frame}>
        <div className={styles.inner}>
          <span className={`${styles.corner} ${styles.tl}`}>✦</span>
          <span className={`${styles.corner} ${styles.tr}`}>✦</span>
          <span className={`${styles.corner} ${styles.bl}`}>✦</span>
          <span className={`${styles.corner} ${styles.br}`}>✦</span>

          <div className={styles.top}>
            <span>о проекте</span>
            <span>Valley of Elegies</span>
          </div>

          <div className={styles.hero}>
            <div className={styles.kicker}>тихое место</div>
            <h1 className={styles.ttl}>Долина</h1>
            <div className={styles.div}><span>✦</span></div>
            <h1 className={`${styles.ttl} ${styles.ttl2}`}>Элегий</h1>
            <p className={styles.lede}>
              О неспешности, внимании и свете, который прячется в обычном дне.
            </p>
          </div>

          <div className={styles.orn}>✦</div>

          <div className={styles.body}>
            <p>
              <em>Долина элегий</em> — это место, где живут мыши. Они подолгу
              выбирают, какую пластинку поставить на вечер, носят друг другу
              еду, когда слов не находится, и выходят в сад проверить, не
              распустилось ли что-нибудь за ночь.
            </p>
            <p>
              Здесь нет ничего великого. Есть старый дуб, под которым однажды
              появилась скамейка. Есть тропинка вдоль ручья, где весной
              расцветает шиповник, и мышата останавливаются, чтобы его
              понюхать. Есть радио — тихое, про то, что на самом деле важно.
            </p>
            <p>
              Это место, где обычная жизнь проживается с таким вниманием,
              что становится красивой. Не потому что в ней случается что-то
              особенное, а потому что кто-то решил не торопиться.
            </p>
            <p>
              «Долина элегий» выросла из моей музыки. Мне нужен был мир,
              в котором она зазвучит не со сцены, а из открытого окна, из-за
              стены чьей-то мастерской, из старого радиоприёмника.
            </p>
            <p>
              За этим проектом — одна пара рук. Потому что мне важно
              прикоснуться к каждой его части самой.
            </p>
          </div>

          <div className={styles.sig}>— Екатерина</div>

          <div className={styles.orn}>✦</div>
        </div>
      </div>

      {/* ── Письма из Долины ── */}
      <div className={styles.letterCard} id="newsletter" style={{ scrollMarginTop: '6rem' }}>
        <div className={styles.letterInner}>

          <div className={styles.letterHead}>
            <span>письма из долины</span>
          </div>

          <div className={styles.news}>
            <p>
              Время от времени из Долины приходит письмо. О том, чем живёт
              деревня, и о новом выпуске, если он подоспел.
            </p>
            {subscribed ? (
              <div className={styles.done}>
                <span style={{ fontSize: '1.5rem' }}>✦</span>
                Благодарим. Письмо из Долины уже в пути.
              </div>
            ) : (
              <>
                <form className={styles.field} onSubmit={submit}>
                  <input
                    type="email"
                    name="recipient[email]"
                    required
                    placeholder="Ваша почта"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <button type="submit">Подписаться</button>
                </form>
                <p className={styles.consent}>
                  Нажимая «Подписаться», вы соглашаетесь на{' '}
                  <a href="/privacy">обработку персональных данных</a>
                  {' '}и получение писем из Долины.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Платформы ── */}
      <div className={styles.platsSection} id="platforms" style={{ scrollMarginTop: '6rem' }}>
        <div className={styles.orn}>✦</div>
        <div className={styles.sech}>слушать на платформах</div>
        <div className={styles.plats}>
          <a className={styles.plat} href="https://podcasts.apple.com/us/podcast/радио-долины-элегий/id1896918738" target="_blank" rel="noopener noreferrer">
            <span className={styles.ic}>
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="11" rx="3"></rect>
                <path d="M6 11a6 6 0 0 0 12 0"></path>
                <path d="M12 17v3.5"></path>
                <path d="M8.5 20.5h7"></path>
              </svg>
            </span>
            <span className={styles.nm}>Apple Podcasts</span>
            <span className={styles.ar}>→</span>
          </a>
          <a className={styles.plat} href="https://open.spotify.com/show/033xbQONziyXaLnOms1gLw" target="_blank" rel="noopener noreferrer">
            <span className={styles.ic}>
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="9.3"></circle>
                <path d="M7 9.4c3.6-1 7.2-.6 10 1.1"></path>
                <path d="M7.6 12.8c3-.8 5.9-.4 8.1 1"></path>
                <path d="M8.2 15.9c2.3-.6 4.4-.3 6 .8"></path>
              </svg>
            </span>
            <span className={styles.nm}>Spotify</span>
            <span className={styles.ar}>→</span>
          </a>
          <a className={styles.plat} href="https://music.yandex.ru/album/42623126" target="_blank" rel="noopener noreferrer">
            <span className={styles.ic}>
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9.3"></circle>
                <path d="M13.4 8v5.6" strokeLinecap="round"></path>
                <path d="M13.4 8c1.7.3 3 .9 3.4 1.7" strokeLinecap="round"></path>
                <circle cx="11.4" cy="14" r="1.9" fill="currentColor" stroke="none"></circle>
              </svg>
            </span>
            <span className={styles.nm}>Яндекс Музыка</span>
            <span className={styles.ar}>→</span>
          </a>
          <a className={styles.plat} href="https://valleyofelegies.mave.digital/" target="_blank" rel="noopener noreferrer">
            <span className={styles.ic}>
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <circle cx="6.6" cy="17.4" r="1.7" fill="currentColor" stroke="none"></circle>
                <path d="M5 11.4a8 8 0 0 1 7.9 8"></path>
                <path d="M5 6.2A13.2 13.2 0 0 1 18.2 19.4"></path>
              </svg>
            </span>
            <span className={styles.nm}>Другие платформы</span>
            <span className={styles.ar}>→</span>
          </a>
        </div>
      </div>

    </div>
  );
}
