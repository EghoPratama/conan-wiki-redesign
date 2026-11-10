import Link from 'next/link';
import type { PageData } from '@/types/page';
import styles from './article.module.css';

/** ‹ sebelumnya | berikutnya › */
export function Chronology({ data }: { data: PageData['chronology'] }) {
  if (!data) return null;
  return (
    <>
    <nav className={styles.chron} aria-label="Previous and next">
      {data.previous ? (
        <Link href={`/wiki/${data.previous.slug}`} rel="prev" className={styles.chronPrev}>
          <span>Previous</span>
          {data.previous.title}
        </Link>
      ) : (
        <span />
      )}
      {data.next ? (
        <Link href={`/wiki/${data.next.slug}`} rel="next" className={styles.chronNext}>
          <span>Next</span>
          {data.next.title}
        </Link>
      ) : (
        <span />
      )}
    </nav>
    {data.lists.length > 0 && (
      <p className={styles.chronLists}>
        {data.lists.map((l) => (
          <Link key={l.slug + l.title} href={`/wiki/${l.slug}`}>
            {l.title}
          </Link>
        ))}
      </p>
    )}
    </>
  );
}
