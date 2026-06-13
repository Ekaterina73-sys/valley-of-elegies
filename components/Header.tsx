'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Header.module.css';
import BurgerMenu from './BurgerMenu';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const goToNewsletter = () => {
    if (pathname === '/about') {
      document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      sessionStorage.setItem('kb_scroll', 'newsletter');
      router.push('/about');
    }
  };

  return (
    <>
      <nav className={styles.nav} aria-label="Главная навигация">
        <div className={styles.navLeft}>
          <button
            className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
            data-open={menuOpen ? '1' : '0'}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={styles.navMid}>
          <Link href="/" className={styles.brand} aria-label="Долина Элегий — на главную">
            Долина Элегий
            <span
              className={styles.brandSpark}
              data-spark=""
              aria-hidden="true"
            >✦</span>
          </Link>
        </div>

        <div className={styles.navRight}>
          <button
            className={styles.subscribe}
            onClick={goToNewsletter}
            aria-label="Подписаться на письма из Долины"
          >
            Подписаться
          </button>
        </div>
      </nav>

      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
