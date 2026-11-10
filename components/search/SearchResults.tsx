'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SearchResponse } from '@/types/character';
import styles from './search.module.css';

/** Hasil pencarian: halaman pertama dari server, sisanya lewat /api/search */
export function SearchResults({
  query,
  initial,
  pageSize,
}: {
  query: string;
  initial: SearchResponse;
  pageSize: number;
}) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  async function loadMore() {
    if (!cursor || state === 'loading') return;
    setState('loading');
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=${pageSize}&cursor=${encodeURIComponent(cursor)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const next: SearchResponse = await res.json();
      setItems((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...next.items.filter((r) => !seen.has(r.id))];
      });
      setCursor(next.nextCursor);
      setState('idle');
    } catch {
      setState('error');
    }
  }

  if (items.length === 0) {
    return <p className={styles.empty}>No pages match &ldquo;{query}&rdquo;. Try a different spelling.</p>;
  }

  return (
    <>
      <ol className={styles.list}>
        {items.map((r) => (
          <li key={r.id}>
            <Link href={`/wiki/${encodeURIComponent(r.slug)}`} className={styles.item}>
              <span className={styles.title}>{r.title}</span>
              {r.snippet && <span className={styles.snippet}>{r.snippet}</span>}
            </Link>
          </li>
        ))}
      </ol>

      <div className={styles.more} aria-live="polite">
        {state === 'error' && <p>Could not load more results.</p>}
        {cursor && (
          <button type="button" onClick={loadMore} disabled={state === 'loading'}>
            {state === 'loading' ? 'Loading…' : state === 'error' ? 'Try again' : 'Load more'}
          </button>
        )}
      </div>
    </>
  );
}
