import { Suspense } from 'react';
import { pageMeta } from '@/lib/seo';
import { getMangaIndex } from '@/lib/wiki/queries';
import { IndexGrid } from '@/components/lists/IndexGrid';
import { PageHeader } from '@/components/lists/PageHeader';

export const metadata = pageMeta({
  title: 'Manga',
  description: 'All Detective Conan manga volumes and chapters, grouped by volume range.',
  path: '/manga',
});

export default function MangaPage() {
  return (
    <>
      <PageHeader kicker="Detective Conan" title="Manga" />
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <Suspense fallback={<p aria-busy="true">Loading volumes…</p>}>
          <Ranges />
        </Suspense>
      </div>
    </>
  );
}

async function Ranges() {
  const { ranges } = await getMangaIndex();
  const tiles = [...ranges].reverse().map((r) => ({
    href: `/manga/${r.range}`,
    title: `Volume ${r.from}–${r.to}`,
    meta: r.chapters ? `Chapters ${r.chapters}` : null,
  }));
  return <IndexGrid tiles={tiles} />;
}
