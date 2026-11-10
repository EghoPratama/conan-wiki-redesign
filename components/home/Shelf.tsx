import Link from 'next/link';
import { WikiImage } from '@/components/WikiImage';
import styles from './home.module.css';
import type { Released } from './view';

export function Shelf({ items }: { items: Released[] }) {
  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="shelf-title">
      <h2 id="shelf-title" className={`display ${styles.sectionTitle}`}>
        Also out now
      </h2>
      <ul className={styles.shelf}>
        {items.map((item) => {
          const body = (
            <>
              <span
                className={`${styles.cover} ${item.shape === 'tall' ? styles.coverTall : styles.coverWide}`}
              >
                <WikiImage src={item.imageUrl} />
              </span>
              <span className={styles.shelfSeries}>{item.series}</span>
              <span className={styles.shelfLabel}>{item.label}</span>
              <span className={styles.shelfTitle}>{item.title}</span>
            </>
          );
          return (
            <li key={item.id}>
              {item.slug ? (
                <Link href={`/wiki/${item.slug}`} className={styles.shelfItem}>
                  {body}
                </Link>
              ) : (
                <div className={styles.shelfItem}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
