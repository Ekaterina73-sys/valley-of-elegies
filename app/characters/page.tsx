import CharactersClient from './CharactersClient';
import { getAllCharacters } from '@/lib/content';
import styles from './characters.module.css';

export const metadata = {
  title: 'Жители Долины · Долина Элегий',
  description: 'Портреты жителей Долины Элегий — с их голосами и привычками.',
};

export default async function CharactersPage() {
  const characters = await getAllCharacters();
  return (
    <div className="page page-enter">
      <div className="container">
        <header className={styles.head}>
          <h1 className={styles.title}>
            Жители Долины элегий
          </h1>
          <p className={styles.desc}>
            Каждого вы могли слышать на радио. Здесь можно познакомиться с жителями Долины поближе, узнать об их особенностях и привычках.
          </p>
        </header>

        <CharactersClient characters={characters} />
      </div>
    </div>
  );
}
