import type { HomeData } from '@/types/home';
import styles from './home.module.css';
import { RichText } from './RichText';

export function DidYouKnow({ data }: { data: HomeData['didYouKnow'] }) {
  if (!data || data.items.length === 0) return null;

  return (
    <section aria-labelledby="dyk-title">
      <h2 id="dyk-title" className={`display ${styles.sectionTitle}`}>
        Did you know
      </h2>
      <ul className={styles.dyk}>
        {data.items.map((item, i) => (
          <li key={i} className={styles.dykItem}>
            <RichText html={item.html} />
          </li>
        ))}
      </ul>
    </section>
  );
}
