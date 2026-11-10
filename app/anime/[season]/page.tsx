import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WikiError } from '@/lib/wiki/client';
import { getSeason } from '@/lib/wiki/queries';
import { EpisodeList } from '@/components/lists/EpisodeList';
import { PageHeader } from '@/components/lists/PageHeader';
import { Pager } from '@/components/lists/Pager';
import { SeasonNav } from '@/components/lists/SeasonNav';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ season: string }>;
}): Promise<Metadata> {
  const { season: raw } = await params;
  const number = /^\d{1,3}$/.test(raw) ? Number(raw) : NaN;
  try {
    const data = await getSeason(number);
    return pageMeta({
      title: data.title,
      description: `All ${data.episodes.length} episodes of Detective Conan ${data.title} (anime), with air dates.`,
      path: `/anime/${raw}`,
    });
  } catch {
    return { title: 'Season not found', robots: { index: false } };
  }
}

export default function SeasonPage({ params }: { params: Promise<{ season: string }> }) {
  return (
    <Suspense fallback={<PageHeader kicker="Anime" title="Loading…" />}>
      <SeasonContent params={params} />
    </Suspense>
  );
}

async function SeasonContent({ params }: { params: Promise<{ season: string }> }) {
  const { season: raw } = await params;
  const number = /^\d{1,3}$/.test(raw) ? Number(raw) : NaN;

  let data;
  try {
    data = await getSeason(number);
  } catch (error) {
    if (error instanceof WikiError && error.status === 404) notFound();
    throw error;
  }

  const { seasons, episodes } = data;
  // Season bisa memuat siaran ulang (nomor episode lama), jadi tampilkan rentang tanggal, bukan nomor
  const firstAir = episodes.find((e) => e.airDate)?.airDate;
  const lastAir = [...episodes].reverse().find((e) => e.airDate)?.airDate;
  const index = seasons.indexOf(data.season);
  const prev = seasons[index - 1];
  const next = seasons[index + 1];

  return (
    <>
      <PageHeader kicker="Anime" title={data.title}>
        {episodes.length > 0 && (
          <p style={{ color: '#c3d0f7' }}>
            {episodes.length} episodes
            {firstAir && lastAir && firstAir !== lastAir ? ` · ${firstAir} – ${lastAir}` : ''}
          </p>
        )}
      </PageHeader>

      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <SeasonNav seasons={seasons} current={data.season} />
        {episodes.length ? (
          <EpisodeList episodes={episodes} />
        ) : (
          <p>No episodes are listed for this season yet.</p>
        )}
        <Pager
          previous={prev ? { href: `/anime/${prev}`, label: `Season ${prev}` } : null}
          next={next ? { href: `/anime/${next}`, label: `Season ${next}` } : null}
        />
      </div>
    </>
  );
}
