'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Detective, Origin } from '@/types/detectives';
import { detectiveHref } from '@/lib/detectiveHref';
import { WikiImage } from '@/components/WikiImage';
import styles from './detectives.module.css';

const href = (slug: string) => `/wiki/${encodeURIComponent(slug)}`;

function Flag({ origin }: { origin: Origin | null }) {
  if (!origin?.flagUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.flag} src={origin.flagUrl} alt={origin.name} title={origin.name} loading="lazy" />
  );
}

function Card({ d }: { d: Detective }) {
  const { recommendation: rec } = d;
  return (
    <li className={styles.card}>
      <Link href={detectiveHref(d)} className={styles.cover} aria-label={`${d.name}, Volume ${d.volume}`}>
        <WikiImage src={d.imageUrl} alt={`${d.name}, Volume ${d.volume} dust-jacket illustration`} fit="natural" />
      </Link>
      <div className={styles.body}>
        <p className={styles.volume}>
          <Link href={href(d.volumeSlug ?? `Volume_${d.volume}`)}>Volume {d.volume}</Link>
        </p>
        <h2 className={styles.name}>
          <Link href={detectiveHref(d)}>{d.name}</Link>
        </h2>
        {d.note && <p className={styles.note}>{d.note}</p>}
        <p className={styles.creator}>
          <Flag origin={d.creatorOrigin} />
          <span>
            by{' '}
            {d.creatorSlug ? <Link href={href(d.creatorSlug)}>{d.creator}</Link> : d.creator}
          </span>
        </p>
        <p className={styles.rec}>
          <span className={styles.recLabel}>Aoyama recommends</span>
          {rec.url ? (
            <a href={rec.url} target="_blank" rel="noopener noreferrer">
              {rec.title}
            </a>
          ) : (
            <span>{rec.title}</span>
          )}
          {rec.japanese && (
            <span className={styles.ja} lang="ja">
              {rec.japanese}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

export function DetectiveGallery({ entries }: { entries: Detective[] }) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [newestFirst, setNewestFirst] = useState(false);

  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) if (e.origin) counts.set(e.origin.name, (counts.get(e.origin.name) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter((e) => {
      if (country && e.origin?.name !== country) return false;
      if (!q) return true;
      return [e.name, e.note, e.creator, e.recommendation.title, e.recommendation.romaji]
        .filter(Boolean)
        .some((t) => t!.toLowerCase().includes(q));
    });
    return newestFirst ? [...list].reverse() : list;
  }, [entries, query, country, newestFirst]);

  return (
    <>
      <form className={styles.filters} role="search" aria-label="Filter detectives" onSubmit={(e) => e.preventDefault()}>
        <label className={styles.field}>
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Detective, author, or story"
          />
        </label>
        <label className={styles.field}>
          <span>Detective&apos;s country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {countries.map(([name, n]) => (
              <option key={name} value={name}>
                {name} ({n})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={styles.sort} onClick={() => setNewestFirst((v) => !v)}>
          {newestFirst ? 'Newest first' : 'Oldest first'}
        </button>
      </form>

      <p className={styles.count} role="status">
        {shown.length === entries.length
          ? `${entries.length} detectives`
          : `${shown.length} of ${entries.length} detectives`}
      </p>

      {shown.length ? (
        <ol className={styles.grid}>
          {shown.map((d) => (
            <Card key={d.volume} d={d} />
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>No detective matches that search.</p>
      )}
    </>
  );
}
