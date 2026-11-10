import Link from 'next/link';
import type { GallerySection } from '@/types/page';
import { WikiImage } from '@/components/WikiImage';
import styles from './article.module.css';

/** Gambar tambahan dari infobox (mis. "Featured Detective & Keyhole" di halaman volume) */
export function SideGallery({ sections }: { sections: GallerySection[] }) {
  if (!sections.length) return null;
  return (
    <div className={styles.sideGallery}>
      {sections.map((section, i) => (
        <section key={`${section.title}-${i}`}>
          {section.title && <h2 className={styles.sideGalleryTitle}>{section.title}</h2>}
          <ul className={styles.sideGalleryGrid}>
            {section.items.map((item) => (
              <li key={item.imageUrl}>
                <WikiImage src={item.imageUrl} alt={item.alt} fit="natural" />
                {item.caption &&
                  (item.slug ? (
                    <Link href={`/wiki/${item.slug}`}>{item.caption}</Link>
                  ) : (
                    <span>{item.caption}</span>
                  ))}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
