import { Suspense } from 'react';
import { getAnimeIndex } from '@/lib/wiki/queries';
import { IndexGrid } from '@/components/lists/IndexGrid';
import { PageHeader } from '@/components/lists/PageHeader';

export default function AnimePage() {
  return (
    <>
      <title>Anime</title>
      <PageHeader kicker="Detective Conan" title="Anime" />
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <Suspense fallback={<p aria-busy="true">Loading seasons…</p>}>
          <Seasons />
        </Suspense>
      </div>
    </>
  );
}

async function Seasons() {
  const { seasons } = await getAnimeIndex();
  const tiles = [...seasons].reverse().map((s) => ({
    href: `/anime/${s.season}`,
    title: s.title,
    meta: s.episodes ? `Episodes ${s.episodes.from}–${s.episodes.to ?? '…'}` : null,
  }));
  return <IndexGrid tiles={tiles} />;
}
