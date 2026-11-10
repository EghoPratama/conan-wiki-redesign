import { Suspense } from 'react';
import type { Metadata } from 'next';
import { WikiError } from '@/lib/wiki/client';
import {
  SEARCH_MAX_QUERY,
  SEARCH_MIN_QUERY,
  SEARCH_PAGE_SIZE,
  searchWiki,
} from '@/lib/wiki/queries';
import { SearchResults } from '@/components/search/SearchResults';
import articleStyles from '@/components/article/article.module.css';
import styles from '@/components/search/search.module.css';

// halaman hasil pencarian tidak perlu masuk indeks mesin pencari
export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } };

type SearchParams = Promise<{ q?: string | string[] }>;

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <Suspense fallback={<Header text="Searching…" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function Header({ text }: { text: string }) {
  return (
    <header className={articleStyles.hero}>
      <div className={`shell ${articleStyles.heroInner}`}>
        <p className={articleStyles.kicker}>Search</p>
        <h1 className={`display ${articleStyles.title}`}>{text}</h1>
      </div>
    </header>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? '').trim().slice(0, SEARCH_MAX_QUERY);

  if (q.length < SEARCH_MIN_QUERY) {
    return (
      <>
        <Header text="Search the wiki" />
        <div className="shell" style={{ paddingBlock: '2rem' }}>
          <p className={styles.empty}>
            Type at least {SEARCH_MIN_QUERY} characters in the search box above.
          </p>
        </div>
      </>
    );
  }

  let results;
  try {
    results = await searchWiki(q, { limit: SEARCH_PAGE_SIZE });
  } catch (error) {
    // query yang ditolak wiki (mis. karakter aneh) = "tidak ada hasil", bukan halaman error
    if (error instanceof WikiError && error.status < 500) {
      results = { items: [], nextCursor: null, total: 0 };
    } else {
      throw error;
    }
  }

  return (
    <>
      <Header text={`Results for “${q}”`} />
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        {results.total != null && results.total > 0 && (
          <p className={styles.count}>
            {results.total.toLocaleString('en-US')} {results.total === 1 ? 'page' : 'pages'} found
          </p>
        )}
        {/* key: pencarian baru = state baru */}
        <SearchResults key={q} query={q} initial={results} pageSize={SEARCH_PAGE_SIZE} />
      </div>
    </>
  );
}
