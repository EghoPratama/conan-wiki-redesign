import { humanize } from './labels';
import styles from './article.module.css';

/** Tabel fakta (infobox) sebagai daftar definisi */
export function Infobox({ data }: { data: Record<string, string> }) {
  const entries = Object.entries(data);
  if (!entries.length) return null;
  return (
    <dl className={styles.facts}>
      {entries.map(([key, value]) => (
        <div key={key} className={styles.fact}>
          <dt>{humanize(key)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
