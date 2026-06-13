import Link from 'next/link';
import styles from './HomeTOC.module.css';

const chapters = [
  {
    id: 'radio',
    href: '/radio',
    roman: 'I',
    title: 'Архив радиовыпусков',
    desc: 'все эпизоды · можно слушать с любого',
    tone: 'warm',
  },
  {
    id: 'characters',
    href: '/characters',
    roman: 'II',
    title: 'Жители Долины',
    desc: 'портреты · с их голосами и привычками',
    tone: 'moss',
  },
  {
    id: 'world',
    href: '/world',
    roman: 'III',
    title: 'Мир Долины Элегий',
    desc: 'заметки о мире · места, звуки, предметы, события',
    tone: 'rose',
  },
];

export default function HomeTOC() {
  return (
    <section className={`container ${styles.tocSection}`}>
      <div className={styles.toc}>
        <div className={styles.tocHead}>
          <div>
            <div className="eyebrow">— оглавление —</div>
            <h2>Что ещё <em>есть на сайте</em></h2>
          </div>
        </div>
        <div className={styles.tocList}>
          {chapters.map(ch => (
            <Link key={ch.id} href={ch.href} className={styles.tocRow} data-tone={ch.tone}>
              <span className={styles.tocRoman}>{ch.roman}</span>
              <div className={styles.tocBody}>
                <h3 className={styles.tocTitle}>{ch.title}</h3>
                <p className={styles.tocDesc}>{ch.desc}</p>
              </div>
              <div className={styles.tocArrow}>
                <span className={styles.leader} />
                <b>перейти</b>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
