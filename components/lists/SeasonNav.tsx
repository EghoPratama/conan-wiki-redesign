import Link from 'next/link';
import styles from './lists.module.css';

export function SeasonNav({ seasons, current }: { seasons: number[]; current: number }) {
  return (
    <nav className={styles.seasonNav} aria-label="Seasons">
      {seasons.map((n) => (
        <Link key={n} href={`/anime/${n}`} aria-current={n === current ? 'page' : undefined}>
          {n}
        </Link>
      ))}
    </nav>
  );
}
