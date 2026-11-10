import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDetectives } from '@/lib/wiki/queries';
import { detectiveHref } from '@/lib/detectiveHref';
import { pageMeta } from '@/lib/seo';
import { getCharacterSummary, getWikipediaSummary } from '@/lib/wiki/wikipedia';
import type { Detective, Origin } from '@/types/detectives';
import type { WikipediaSummary } from '@/lib/wiki/wikipedia';
import { PageHeader } from '@/components/lists/PageHeader';
import { Pager } from '@/components/lists/Pager';
import { WikiImage } from '@/components/WikiImage';
import styles from '@/components/detectives/detectives.module.css';

const href = (slug: string) => `/wiki/${encodeURIComponent(slug)}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ volume: string }>;
}): Promise<Metadata> {
  const { volume: raw } = await params;
  const volume = /^\d{1,3}$/.test(raw) ? Number(raw) : NaN;
  try {
    const { entries } = await getDetectives();
    const d = entries.find((e) => e.volume === volume);
    if (!d) return { title: 'Detective not found', robots: { index: false } };
    return pageMeta({
      title: `${d.name} (Volume ${d.volume})`,
      description: `${d.name}, created by ${d.creator}, is the featured detective of Detective Conan volume ${d.volume}. Aoyama recommends \u201c${d.recommendation.title}\u201d.`,
      path: `/detectives/${d.volume}`,
      image: d.imageUrl,
    });
  } catch {
    return { title: 'Detective Picture Book' };
  }
}

export default function DetectivePage({ params }: { params: Promise<{ volume: string }> }) {
  return (
    <Suspense fallback={<PageHeader kicker="Detective Picture Book" title="Loading…" />}>
      <DetectiveContent params={params} />
    </Suspense>
  );
}

function Flag({ origin }: { origin: Origin | null }) {
  if (!origin?.flagUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.flag} src={origin.flagUrl} alt="" loading="lazy" />
  );
}

function Related({ title, items }: { title: string; items: Detective[] }) {
  if (!items.length) return null;
  return (
    <section className={styles.related}>
      <h2>{title}</h2>
      <ul>
        {items.map((d) => (
          <li key={d.volume}>
            <Link href={detectiveHref(d)}>
              <span className={styles.relatedImage}>
                <WikiImage src={d.imageUrl} alt="" fit="natural" />
              </span>
              <span>
                <strong>{d.name}</strong>
                <small>Volume {d.volume}</small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WikipediaCard({ id, heading, summary }: { id: string; heading: string; summary: WikipediaSummary }) {
  return (
    <section className={styles.story} aria-labelledby={id}>
      <h2 id={id}>{heading}</h2>
      {summary.description && <p className={styles.storyDesc}>{summary.description}</p>}
      <p lang={summary.lang}>{summary.extract}</p>
      <p className={styles.attribution}>
        From{' '}
        <a href={summary.pageUrl} target="_blank" rel="noopener noreferrer">
          Wikipedia
        </a>{' '}
        (<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>)
      </p>
    </section>
  );
}

/** Ringkasan tokoh dari Wikipedia; dimuat terpisah supaya halaman tidak menunggunya */
async function CharacterSummary({ name, creator }: { name: string; creator: string }) {
  const summary = await getCharacterSummary(name, creator);
  if (!summary) return null;
  return <WikipediaCard id="character-heading" heading={`About ${name}`} summary={summary} />;
}

/** Ringkasan cerita rekomendasi dari Wikipedia */
async function StorySummary({ url, title }: { url: string | null; title: string }) {
  const summary = await getWikipediaSummary(url);
  if (!summary) return null;
  return <WikipediaCard id="story-heading" heading={`About \u201c${title}\u201d`} summary={summary} />;
}

async function DetectiveContent({ params }: { params: Promise<{ volume: string }> }) {
  const { volume: raw } = await params;
  const volume = /^\d{1,3}$/.test(raw) ? Number(raw) : NaN;

  const { entries } = await getDetectives();
  const index = entries.findIndex((e) => e.volume === volume);
  if (index === -1) notFound();

  const d = entries[index];
  const prev = entries[index - 1];
  const next = entries[index + 1];
  const { recommendation: rec } = d;

  const sameCreator = entries.filter((e) => e.volume !== d.volume && e.creator === d.creator);
  const sameCountry = d.origin
    ? entries
        .filter((e) => e.volume !== d.volume && e.origin?.name === d.origin!.name && e.creator !== d.creator)
        .slice(0, 6)
    : [];

  return (
    <>
      <PageHeader kicker={`Detective Picture Book · Volume ${d.volume}`} title={d.name}>
        {d.note && <p className={styles.intro}>{d.note}</p>}
      </PageHeader>

      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <div className={styles.detail}>
          <div className={styles.detailImage}>
            <WikiImage src={d.imageUrl} alt={`${d.name}, Volume ${d.volume} dust-jacket illustration`} fit="natural" priority />
          </div>

          <dl className={styles.facts}>
            <div>
              <dt>Featured in</dt>
              <dd>
                <Link href={href(d.volumeSlug ?? `Volume_${d.volume}`)}>Volume {d.volume}</Link>
              </dd>
            </div>
            {d.origin && (
              <div>
                <dt>Origin</dt>
                <dd className={styles.inline}>
                  <Flag origin={d.origin} />
                  {d.origin.name}
                </dd>
              </div>
            )}
            <div>
              <dt>Created by</dt>
              <dd className={styles.inline}>
                <Flag origin={d.creatorOrigin} />
                {d.creatorSlug ? <Link href={href(d.creatorSlug)}>{d.creator}</Link> : d.creator}
              </dd>
            </div>
            <div>
              <dt>Aoyama recommends</dt>
              <dd>
                {rec.url ? (
                  <a href={rec.url} target="_blank" rel="noopener noreferrer">
                    <em>{rec.title}</em>
                  </a>
                ) : (
                  <em>{rec.title}</em>
                )}
                {(rec.japanese || rec.romaji) && (
                  <span className={styles.ja} lang="ja">
                    {[rec.japanese, rec.romaji].filter(Boolean).join(' · ')}
                  </span>
                )}
              </dd>
            </div>
            {d.slug && (
              <div>
                <dt>Wiki article</dt>
                <dd>
                  <Link href={href(d.slug)}>Read the full article on {d.name}</Link>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <Suspense fallback={null}>
          <CharacterSummary name={d.name} creator={d.creator} />
        </Suspense>
        {rec.url && (
          <Suspense fallback={null}>
            <StorySummary url={rec.url} title={rec.title} />
          </Suspense>
        )}

        <Related title={`More by ${d.creator}`} items={sameCreator} />
        <Related title={`More from ${d.origin?.name ?? 'the same country'}`} items={sameCountry} />

        <Pager
          previous={prev ? { href: `/detectives/${prev.volume}`, label: prev.name } : null}
          next={next ? { href: `/detectives/${next.volume}`, label: next.name } : null}
        />
        <p className={styles.back}>
          <Link href="/detectives">All detectives</Link>
        </p>
      </div>
    </>
  );
}
