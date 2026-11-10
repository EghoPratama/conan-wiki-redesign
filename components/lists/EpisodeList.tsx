import Link from 'next/link';
import type { Episode } from '@/types/lists';
import styles from './lists.module.css';

const wikiHref = (slug: string) => `/wiki/${encodeURIComponent(slug)}`;

export function EpisodeList({ episodes }: { episodes: Episode[] }) {
  return (
    <ol className={styles.rows}>
      {episodes.map((e, i) => (
        // nomor Jepang bisa sama (dua nomor internasional) atau muncul lagi (siaran ulang)
        <li key={`${e.number}-${e.international ?? i}`} className={styles.row}>
          <div className={`display ${styles.number}`} aria-label={`Episode ${e.number}`}>
            {e.number}
            {e.international && <span className={styles.int}>Int. {e.international}</span>}
          </div>

          <div className={styles.main}>
            <h2 className={styles.rowTitle}>
              {e.slug ? <Link href={wikiHref(e.slug)}>{e.title}</Link> : e.title}
              {e.subtitle && <span className={styles.badge}>{e.subtitle}</span>}
            </h2>

            <p className={styles.meta}>
              {e.airDate && <span>{e.airDate}</span>}
              {e.isOriginal ? (
                <span>TV Original</span>
              ) : (
                e.mangaLinks.map((l) =>
                  l.slug ? (
                    <Link key={l.label} href={wikiHref(l.slug)}>
                      {l.label}
                    </Link>
                  ) : (
                    <span key={l.label}>{l.label}</span>
                  )
                )
              )}
            </p>

            {e.plot.length > 0 && (
              <ul className={styles.tags} aria-label="Plot">
                {e.plot.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}

            {(e.summary || e.notes.length > 0) && (
              <details className={styles.details}>
                <summary>Summary</summary>
                {e.summary && <p>{e.summary}</p>}
                {e.notes.length > 0 && (
                  <ul className={styles.notes}>
                    {e.notes.map((n, i) => (
                      <li key={i}>
                        {n.tag && <strong>{n.tag}: </strong>}
                        {n.text}
                      </li>
                    ))}
                  </ul>
                )}
                {e.nextHint && <p className={styles.hint}>Next Conan&rsquo;s Hint: {e.nextHint}</p>}
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
