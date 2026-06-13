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
            Каждого вы могли уже слышать в эпизодах. Здесь — то, что между строк: возраст, привычки, любимая чашка. Кликните по любому, чтобы узнать побольше.
          </p>
        </header>

        <CharactersClient characters={characters} />
      </div>
    </div>
  );
}
