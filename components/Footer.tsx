import Link from 'next/link';
import styles from './Footer.module.css';
import { KB_ROUTES } from '@/lib/config';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <h4>Долина Элегий</h4>
          <p style={{ maxWidth: '36ch' }}>
            Проект <em>о неспешности, внимании и свете</em>,
            который прячется в обычном дне.
          </p>
        </div>
        <div>
          <h4>Разделы</h4>
          <ul>
            {KB_ROUTES.slice(1, 5).map(r => (
              <li key={r.id}>
                <Link href={r.href} className={styles.linkBtn}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Слушать</h4>
          <ul>
            <li><a href="https://podcasts.apple.com/us/podcast/радио-долины-элегий/id1896918738" target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>Apple Podcasts</a></li>
            <li><a href="https://open.spotify.com/show/033xbQONziyXaLnOms1gLw" target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>Spotify</a></li>
            <li><a href="https://music.yandex.ru/album/42623126" target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>Яндекс Музыка</a></li>
            <li><a href="https://valleyofelegies.mave.digital/" target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>Все платформы →</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
