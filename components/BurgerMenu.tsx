'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './BurgerMenu.module.css';
import { KB_ROUTES } from '@/lib/config';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BurgerMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => firstLinkRef.current?.focus({ preventScroll: true }), 320);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`${styles.scrim} ${open ? styles.scrimOpen : ''}`}
        data-open={open ? '1' : '0'}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        data-open={open ? '1' : '0'}
        aria-hidden={!open}
      >
        <div className={styles.head}>
          <span className={styles.eyebrow}>оглавление</span>
          <button className={styles.close} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2 L 12 12 M 12 2 L 2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            закрыть
          </button>
        </div>

        <div className={styles.body}>
          <ul className={styles.list}>
            {KB_ROUTES.map((r, i) => {
              const isActive = pathname === r.href || (r.href !== '/' && pathname.startsWith(r.href));
              return (
                <li key={r.id} className={styles.listItem}>
                  <Link
                    ref={i === 0 ? firstLinkRef : null}
                    href={r.href}
                    className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                    data-active={isActive ? '1' : '0'}
                    onClick={onClose}
                  >
                    {r.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className={styles.foot}>
            <button
              className={styles.subBtn}
              onClick={() => {
                onClose();
                if (pathname === '/about') {
                  document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  sessionStorage.setItem('kb_scroll', 'newsletter');
                  router.push('/about');
                }
              }}
            >
              Подписаться на письма →
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
