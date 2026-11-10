import Link from 'next/link';
import styles from './lists.module.css';

/** Sebelumnya / berikutnya antar season atau rentang volume */
export function Pager({
  previous,
  next,
}: {
  previous: { href: string; label: string } | null;
  next: { href: string; label: string } | null;
}) {
  return (
    <nav className={styles.pager} aria-label="Previous and next">
      {previous ? (
        <Link href={previous.href} rel="prev">
          <span>Previous</span>
          {previous.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} rel="next" className={styles.pagerNext}>
          <span>Next</span>
          {next.label}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
