import { Suspense } from 'react';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { getMovies } from '@/lib/wiki/queries';
import { PageHeader } from '@/components/lists/PageHeader';
import list from '@/components/lists/lists.module.css';
import styles from '@/components/extra/extra.module.css';

export const metadata = pageMeta({
  title: 'Movies',
  description: 'Every Detective Conan movie: release dates, runtimes, box office and the characters in each plot.',
  path: '/movies',
});

export default function MoviesPage() {
  return (
    <>
      <PageHeader kicker="Detective Conan" title="Movies" />
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <Suspense fallback={<p aria-busy="true">Loading movies…</p>}>
          <MovieGroups />
        </Suspense>
      </div>
    </>
  );
}

async function MovieGroups() {
  const { groups } = await getMovies();
  return (
    <>
      {groups.map((g) => (
        <section key={g.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{g.title}</h2>
          <ol className={list.rows}>
            {g.movies.map((m) => (
              <li key={`${m.number}-${m.title}`} className={list.row}>
                <div className={`display ${list.number}`} aria-label={`Movie ${m.number}`}>
                  {m.number}
                </div>
                <div className={list.main}>
                  <h3 className={list.rowTitle}>
                    {m.slug ? <Link href={`/wiki/${encodeURIComponent(m.slug)}`}>{m.title}</Link> : m.title}
                  </h3>
                  <p className={list.meta}>
                    {m.releaseDate && <span>{m.releaseDate}</span>}
                    {m.runtime && <span>{m.runtime}</span>}
                    {m.boxOffice && <span>{m.boxOffice}</span>}
                    {m.dubDate && <span>EN dub: {m.dubDate}</span>}
                  </p>
                  {m.plot.length > 0 && (
                    <ul className={list.tags} aria-label="Plot">
                      {m.plot.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}
