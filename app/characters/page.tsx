import { Suspense } from 'react';
import { CHARACTERS_PAGE_SIZE, getCharacterList } from '@/lib/wiki/queries';
import { CharacterGrid } from '@/components/characters/CharacterGrid';
import styles from '@/components/article/article.module.css';

export default function CharactersPage() {
  return (
    <>
      <title>Characters</title>
      <header className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <p className={styles.kicker}>Detective Conan</p>
          <h1 className={`display ${styles.title}`}>Characters</h1>
        </div>
      </header>
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <Suspense fallback={<p aria-busy="true">Loading characters…</p>}>
          <Grid />
        </Suspense>
      </div>
    </>
  );
}

async function Grid() {
  const initial = await getCharacterList({ limit: CHARACTERS_PAGE_SIZE });
  return <CharacterGrid initial={initial} pageSize={CHARACTERS_PAGE_SIZE} />;
}
