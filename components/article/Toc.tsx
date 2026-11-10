import type { PageSection } from '@/types/page';
import styles from './article.module.css';

export function Toc({ sections }: { sections: PageSection[] }) {
  const items = sections.filter((s) => s.level <= 3);
  if (items.length < 3) return null;
  return (
    <nav className={styles.toc} aria-label="On this page">
      <h2 className={styles.asideTitle}>On this page</h2>
      <ol>
        {items.map((s) => (
          <li key={s.id} data-level={s.level}>
            <a href={`#${s.id}`}>{s.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
