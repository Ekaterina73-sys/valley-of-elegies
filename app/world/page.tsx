import WorldClient from './WorldClient';
import { getAllWorldCards } from '@/lib/content';
import styles from './world.module.css';

export const metadata = {
  title: 'Мир Долины · Долина Элегий',
  description: 'Места, события, предметы и рецепты из Долины Элегий.',
};

export default async function WorldPage() {
  const worldCards = await getAllWorldCards();
  return (
    <div className="page page-enter">
      <div className="container">
        <header className={styles.head}>
          <h1 className={styles.title}>
            Мир Долины элегий · разное
          </h1>
          <p className={styles.desc}>
            Долина живёт и между эпизодами. Здесь её места и предметы, звуки и рецепты, события и всё, что не уместилось в выпуски.
          </p>
        </header>

        <WorldClient worldCards={worldCards} />
      </div>
    </div>
  );
}
