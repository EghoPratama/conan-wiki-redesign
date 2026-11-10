import Link from 'next/link';
import { WikiImage } from '@/components/WikiImage';
import type { TopicGroup } from '@/types/home';
import styles from './home.module.css';

// Judul dari wiki ("General topics") kurang menjelaskan fungsinya bagi pembaca
const HEADINGS: Record<string, string> = {
  'General topics': 'Browse the wiki',
  'Specific topics': 'Start here',
};

export function Topics({ groups }: { groups: TopicGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <div className={styles.topics}>
      {groups.map((group) => (
        <section key={group.heading} aria-labelledby={`topics-${group.heading}`}>
          <div className={styles.topicsHead}>
            {group.imageUrl && (
              <span className={styles.topicsImage}>
                <WikiImage src={group.imageUrl} alt={group.imageLabel ?? ''} />
              </span>
            )}
            <h2 id={`topics-${group.heading}`} className={`display ${styles.sectionTitle}`}>
              {HEADINGS[group.heading] ?? group.heading}
            </h2>
          </div>
          <ul className={styles.topicList}>
            {group.items.map((item) => (
              <li key={item.title}>
                {item.slug ? (
                  <Link href={`/wiki/${item.slug}`} className={styles.topicLink}>
                    {item.title}
                  </Link>
                ) : (
                  <span className={styles.topicLink}>{item.title}</span>
                )}
                {item.description && <span className={styles.topicDesc}>{item.description}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
