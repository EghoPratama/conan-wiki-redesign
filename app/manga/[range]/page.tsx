import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { WikiError } from '@/lib/wiki/client';
import { getMangaIndex, getVolumeRange } from '@/lib/wiki/queries';
import { PageHeader } from '@/components/lists/PageHeader';
import { Pager } from '@/components/lists/Pager';
import { VolumeList } from '@/components/lists/VolumeList';

export default function RangePage({ params }: { params: Promise<{ range: string }> }) {
  return (
    <Suspense fallback={<PageHeader kicker="Manga" title="Loading…" />}>
      <RangeContent params={params} />
    </Suspense>
  );
}

async function RangeContent({ params }: { params: Promise<{ range: string }> }) {
  const { range } = await params;

  let data;
  try {
    data = await getVolumeRange(range);
  } catch (error) {
    if (error instanceof WikiError && error.status === 404) notFound();
    throw error;
  }

  // tetangga untuk navigasi; kalau indeks gagal dimuat, halaman tetap tampil
  const ranges = await getMangaIndex().then(
    (i) => i.ranges,
    () => []
  );
  const i = ranges.findIndex((r) => r.range === range);
  const prev = i > 0 ? ranges[i - 1] : null;
  const next = i >= 0 ? ranges[i + 1] : null;
  const label = (r: { from: number; to: number }) => `Volume ${r.from}–${r.to}`;

  return (
    <>
      <title>{data.title}</title>
      <PageHeader kicker="Manga" title={data.title.replace('-', '–')} />
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        {data.volumes.length ? (
          <VolumeList volumes={data.volumes} />
        ) : (
          <p>No volumes are listed here yet.</p>
        )}
        <Pager
          previous={prev ? { href: `/manga/${prev.range}`, label: label(prev) } : null}
          next={next ? { href: `/manga/${next.range}`, label: label(next) } : null}
        />
      </div>
    </>
  );
}
