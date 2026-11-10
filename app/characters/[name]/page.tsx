import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WikiError } from '@/lib/wiki/client';
import { getCharacter } from '@/lib/wiki/queries';
import { Article } from '@/components/article/Article';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';
import { Infobox } from '@/components/article/Infobox';
import { WikiImage } from '@/components/WikiImage';
import { decodeParam } from '@/components/article/labels';
import { pageMeta } from '@/lib/seo';
import styles from '@/components/article/article.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  try {
    const c = await getCharacter(decodeParam(name));
    const jp = c.profile.japaneseName;
    return pageMeta({
      title: c.name,
      description: `${c.name}${jp ? ` (${jp})` : ''}, a character in Detective Conan. Profile, background and appearances.`,
      path: `/characters/${name}`,
      image: c.imageUrl,
      type: 'article',
    });
  } catch {
    return { title: 'Character not found', robots: { index: false } };
  }
}

export default function CharacterPage({ params }: { params: Promise<{ name: string }> }) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <CharacterContent params={params} />
    </Suspense>
  );
}

async function CharacterContent({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let character;
  try {
    character = await getCharacter(decodeParam(name));
  } catch (error) {
    if (error instanceof WikiError && error.status === 404) notFound();
    throw error;
  }

  const { japaneseName, ...facts } = character.profile;

  return (
    <article>
      <header className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <p className={styles.kicker}>Character</p>
          <h1 className={`display ${styles.title}`}>{character.name}</h1>
          {japaneseName && <p className={styles.subtitle}>{japaneseName}</p>}
        </div>
      </header>

      <div className={`shell ${styles.layout}`}>
        <aside className={styles.aside}>
          {character.imageUrl && (
            <div className={styles.portrait}>
              <WikiImage src={character.imageUrl} alt={character.name} priority fit="natural" />
            </div>
          )}
          <Infobox data={facts} />
        </aside>
        <div className={styles.main}>
          <Article html={character.cleanHtmlContent} />
        </div>
      </div>
    </article>
  );
}
