import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { WikiError } from '@/lib/wiki/client';
import { getSeason } from '@/lib/wiki/queries';
import { EpisodeList } from '@/components/lists/EpisodeList';
import { PageHeader } from '@/components/lists/PageHeader';
import { Pager } from '@/components/lists/Pager';
import { SeasonNav } from '@/components/lists/SeasonNav';

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
      <title>{data.title}</title>
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
