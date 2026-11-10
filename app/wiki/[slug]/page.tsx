import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { WikiError } from '@/lib/wiki/client';
import { getPage } from '@/lib/wiki/queries';
import { Article } from '@/components/article/Article';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';
import { Chronology } from '@/components/article/Chronology';
import { Infobox } from '@/components/article/Infobox';
import { SideGallery } from '@/components/article/SideGallery';
import { Toc } from '@/components/article/Toc';
import { WikiImage } from '@/components/WikiImage';
import { decodeParam } from '@/components/article/labels';
import styles from '@/components/article/article.module.css';

// Halaman statis (shell) + isi yang dimuat di dalam <Suspense>:
// aman dengan `cacheComponents: true` maupun tanpa.
export default function WikiPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <WikiPageContent params={params} />
    </Suspense>
  );
}

async function WikiPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let page;
  try {
    page = await getPage(decodeParam(slug));
  } catch (error) {
    if (error instanceof WikiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <article>
      {/* React 19 memindahkan <title> ke <head> */}
      <title>{page.title}</title>

      <header className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          {page.heading && <p className={styles.kicker}>{page.heading}</p>}
          <h1 className={`display ${styles.title}`}>{page.title}</h1>
        </div>
      </header>

      <div className={`shell ${styles.layout}`}>
        <aside className={styles.aside}>
          {page.imageUrl && (
            <div className={styles.portrait}>
              <WikiImage src={page.imageUrl} alt={page.title} priority fit="natural" />
            </div>
          )}
          <Infobox data={page.infobox} />
          <SideGallery sections={page.gallery} />
          <Toc sections={page.sections} />
        </aside>

        <div className={styles.main}>
          <Article html={page.html} />
          <Chronology data={page.chronology} />
        </div>
      </div>
    </article>
  );
}
