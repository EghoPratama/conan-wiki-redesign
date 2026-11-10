import Link from 'next/link';
import type { Volume } from '@/types/lists';
import styles from './lists.module.css';

const wikiHref = (slug: string) => `/wiki/${encodeURIComponent(slug)}`;

export function VolumeList({ volumes }: { volumes: Volume[] }) {
  return (
    <ol className={styles.rows}>
      {volumes.map((v) => (
        <li key={v.number} className={styles.row} id={`volume-${v.number}`}>
          <div className={`display ${styles.number}`} aria-label={`Volume ${v.number}`}>
            {v.number}
            {v.chapters && <span className={styles.int}>Ch. {v.chapters}</span>}
          </div>

          <div className={styles.main}>
            <h2 className={styles.rowTitle}>
              <Link href={wikiHref(v.slug)}>Volume {v.number}</Link>
            </h2>

            <p className={styles.meta}>
              {v.japanese.releaseDate && <span>JP {v.japanese.releaseDate}</span>}
              {v.english.releaseDate && <span>EN {v.english.releaseDate}</span>}
            </p>

            {v.plot.length > 0 && (
              <ul className={styles.tags} aria-label="Plot">
                {v.plot.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}

            {v.chapterList.length > 0 && (
              <details className={styles.details} open>
                <summary>{v.chapterList.length} chapters</summary>
                <ol className={styles.chapters}>
                  {v.chapterList.map((c) => (
                    <li key={c.number}>
                      <span className={styles.chNumber}>
                        {c.label} {c.number}
                      </span>
                      <span>
                        {c.slug ? <Link href={wikiHref(c.slug)}>{c.title}</Link> : c.title}
                        {c.japanese && <span className={styles.ja}> {c.japanese}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {(v.summary || v.notes.length > 0) && (
              <details className={styles.details}>
                <summary>Plot notes</summary>
                {v.summary && <p>{v.summary}</p>}
                <ul className={styles.notes}>
                  {v.notes.map((n, i) => (
                    <li key={i}>
                      {n.tag && <strong>{n.tag}: </strong>}
                      {n.text}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
