import Link from 'next/link';
import { getLatestEpisode } from '@/lib/content';

export const dynamic = 'force-dynamic';
import Window from '@/components/Window';
import AudioPlayer from '@/components/AudioPlayer';
import HomeTOC from '@/components/HomeTOC';
import HomeQuote from '@/components/HomeQuote';
import HomeReveal from '@/components/HomeReveal';
import SplitTitle from '@/components/SplitTitle';
import styles from './page.module.css';

export default async function Home() {
  const latest = await getLatestEpisode();

  return (
    <HomeReveal>
      <div className="page page-enter">
        <div className="container">
          <div className={styles.winGrid}>

            {/* Группа 2: Окно — fade-in, без translateY */}
            <div className={styles.winStage} data-intro="window">
              <Window />
            </div>

            <div className={styles.winSide}>
              {/* Группа 3.1: метка */}
              <div className="eyebrow" data-intro="1">радио · истории · музыка</div>

              <h1 className={styles.winTitle}>
                {/* Буква за буквой: Д(150мс)…а(500мс) → э(570мс)…й(920мс) */}
                <SplitTitle text="Долина" baseDelay={150} letterGap={70} />
                {' '}
                <SplitTitle text="элегий" tag="em" baseDelay={570} letterGap={70} />
              </h1>

              {/* Группа 3.4: описание */}
              <p className={styles.intro} data-intro="4">
                Тихое место, где живут мыши: пекут пироги, навещают друг друга
                без повода и подолгу смотрят на закат. А ещё отсюда вещает радио,
                с новостями и музыкой. На этом сайте — выпуски, жители и всё
                остальное, чем живёт деревня. Слушать и читать можно в любом порядке.
              </p>

              {/* Группа 3.5: кнопки */}
              <div className={styles.winActions} data-intro="5">
                <Link href="/radio" className="btn">
                  Послушать радио →
                </Link>
                <Link href="/about" className="btn ghost">
                  О проекте
                </Link>
              </div>

              {/* Группа 4: плеер */}
              {latest && (
                <div className={styles.winMini}>
                  <span
                    className="hand"
                    style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.5rem' }}
                    data-intro="6"
                  >
                    — сейчас в эфире —
                  </span>
                  <div data-intro="7">
                    <AudioPlayer episode={latest} variant="compact" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <HomeTOC />
        <HomeQuote />
      </div>
    </HomeReveal>
  );
}
