'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CharacterSummary, Paginated } from '@/types/character';
import { WikiImage } from '@/components/WikiImage';
import styles from './characters.module.css';

/** Grid karakter: halaman pertama dari server, sisanya dimuat lewat /api/characters */
export function CharacterGrid({
  initial,
  pageSize,
}: {
  initial: Paginated<CharacterSummary>;
  pageSize: number;
}) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  async function loadMore() {
    if (!cursor || state === 'loading') return;
    setState('loading');
    try {
      const res = await fetch(`/api/characters?limit=${pageSize}&cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) throw new Error(String(res.status));
      const next: Paginated<CharacterSummary> = await res.json();
      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...next.items.filter((c) => !seen.has(c.id))];
      });
      setCursor(next.nextCursor);
      setState('idle');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <ul className={styles.grid}>
        {items.map((c) => (
          <li key={c.id}>
            <Link href={`/characters/${encodeURIComponent(c.slug)}`} className={styles.card}>
              <span className={styles.photo}>
                <WikiImage src={c.thumbnailUrl} />
              </span>
              <span className={styles.name}>{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.more} aria-live="polite">
        {state === 'error' && <p>Could not load more characters.</p>}
        {cursor && (
          <button type="button" onClick={loadMore} disabled={state === 'loading'}>
            {state === 'loading' ? 'Loading…' : state === 'error' ? 'Try again' : 'Load more'}
          </button>
        )}
      </div>
    </>
  );
}
