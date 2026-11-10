import { Suspense } from 'react';
import type { Metadata } from 'next';
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
import { pageMeta } from '@/lib/seo';
import styles from '@/components/article/article.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPage(decodeParam(slug));
    return pageMeta({
      title: page.title,
      description: page.description ?? `${page.title} on the Detective Conan Wiki.`,
      path: `/wiki/${slug}`,
      image: page.imageUrl,
      type: 'article',
    });
  } catch {
    // tidak ada / wiki error: isi halaman yang menampilkan "Case not found" atau error-nya
    return { title: 'Case not found', robots: { index: false } };
  }
}

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
