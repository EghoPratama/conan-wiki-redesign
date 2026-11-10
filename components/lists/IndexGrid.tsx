import Link from 'next/link';
import styles from './lists.module.css';

export interface IndexTile {
  href: string;
  title: string;
  meta?: string | null;
}

/** Kotak-kotak pilihan: season anime atau rentang volume manga */
export function IndexGrid({ tiles }: { tiles: IndexTile[] }) {
  return (
    <ul className={styles.tiles}>
      {tiles.map((t) => (
        <li key={t.href}>
          <Link href={t.href} className={styles.tile}>
            <span className={`display ${styles.tileTitle}`}>{t.title}</span>
            {t.meta && <span className={styles.tileMeta}>{t.meta}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
