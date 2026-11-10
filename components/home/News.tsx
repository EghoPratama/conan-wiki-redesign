import type { ListGroup } from '@/types/home';
import styles from './home.module.css';
import { RichText } from './RichText';

// Wiki menandai berita baru dengan <span><b>NEW!</b></span> di awal
const NEW_MARK = /^<span>\s*<b>\s*NEW!\s*<\/b>\s*<\/span>\s*/;

export function News({ groups }: { groups: ListGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="news-title">
      <h2 id="news-title" className={`display ${styles.sectionTitle}`}>
        News
      </h2>
      <div className={styles.newsGroups}>
        {groups.map((group, index) => (
          <details key={group.heading} className={styles.newsGroup} open={index === 0}>
            <summary className={styles.newsSummary}>
              <span className={`display ${styles.newsName}`}>{group.heading}</span>
              <span className={styles.newsCount}>{group.items.length}</span>
            </summary>
            <ul className={styles.newsList}>
              {group.items.map((item, i) => {
                // lencana ikut di dalam HTML teks supaya tetap sebaris dengan kalimat pertama
                const html = NEW_MARK.test(item.html)
                  ? `<span class="news-new">New</span> ${item.html.replace(NEW_MARK, '')}`
                  : item.html;
                return (
                  <li key={i} className={styles.newsItem}>
                    <RichText html={html} />
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
