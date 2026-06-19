import EpisodeList from '@/components/EpisodeList';
import { getAllEpisodes, getAllTracks } from '@/lib/content';
import styles from './radio.module.css';

export const metadata = {
  title: 'Радио · Долина Элегий',
  description: 'Архив радиовыпусков из Долины Элегий. Слушайте истории о мышах, которые живут размеренной жизнью.',
};

export default async function RadioPage() {
  const [episodes, tracks] = await Promise.all([getAllEpisodes(), getAllTracks()]);
  return (
    <div className="page page-enter">
      <div className="container">
        <header className={styles.head}>
          <h1>Радио</h1>
          <p className={styles.lede}>
            Иногда здесь выходят выпуски из Долины. В них рассказывают о том, что случилось,
            и о том, что просто шло своим чередом. Вести, будни, чтения и много всего интересного.
          </p>
        </header>

        <EpisodeList episodes={episodes} tracks={tracks} />
      </div>
    </div>
  );
}
