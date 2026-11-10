import Link from 'next/link';
import { WikiImage } from '@/components/WikiImage';
import type { HomeData } from '@/types/home';
import styles from './home.module.css';
import { RichText } from './RichText';

export function ArticleOfTheMonth({ data }: { data: HomeData['articleOfTheMonth'] }) {
  if (!data) return null;

  return (
    <section className={styles.aotm} aria-labelledby="aotm-title">
      <div className={styles.aotmImage}>
        <WikiImage src={data.imageUrl} alt={data.caption ?? ''} />
        {data.caption && <p className={styles.aotmCaption}>{data.caption}</p>}
      </div>
      <div>
        <h2 id="aotm-title" className={`display ${styles.sectionTitle}`}>
          Article of the month
        </h2>
        <RichText as="p" html={data.html} className={styles.aotmBody} />
        {data.slug && (
          <Link href={`/wiki/${data.slug}`} className={styles.textLink}>
            Read the full article
          </Link>
        )}
      </div>
    </section>
  );
}
