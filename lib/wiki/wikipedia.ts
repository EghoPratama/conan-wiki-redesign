import { cacheLife } from 'next/cache';

/**
 * Ringkasan artikel Wikipedia (REST API `page/summary`), dipakai untuk melengkapi halaman
 * yang datanya tipis, mis. cerita yang direkomendasikan Aoyama. Konten Wikipedia berlisensi
 * CC BY-SA 4.0, jadi tampilan WAJIB menyertakan atribusi dan tautan `pageUrl`.
 */

export interface WikipediaSummary {
  title: string;
  /** Kode bahasa Wikipedia: "en", "ja", ... */
  lang: string;
  /** Satu paragraf pembuka, teks polos */
  extract: string;
  /** Deskripsi pendek, mis. "1890 novel by Arthur Conan Doyle" */
  description: string | null;
  pageUrl: string;
}

const USER_AGENT = 'ConanWikiRedesign/0.1 (fan project; Next.js)';
const TIMEOUT_MS = 8000;

/**
 * "http://en.wikipedia.org/wiki/ja:%E9%BB%84..." -> { lang: 'ja', title: '黄金仮面' }
 * (di wiki Conan, prefix "ja:" artinya Wikipedia bahasa Jepang). Selain host wikipedia.org -> null.
 */
export function parseWikipediaUrl(raw: string): { lang: string; title: string } | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const hostLang = host.match(/^([a-z]{2,3})\.wikipedia\.org$/)?.[1];
  if (!hostLang || !url.pathname.startsWith('/wiki/')) return null;

  let title: string;
  try {
    title = decodeURIComponent(url.pathname.slice('/wiki/'.length));
  } catch {
    return null;
  }
  let lang = hostLang;
  const prefixed = title.match(/^([a-z]{2,3}):(.+)$/);
  if (prefixed) {
    lang = prefixed[1];
    title = prefixed[2];
  }
  title = title.trim();
  return title ? { lang, title } : null;
}

/** Alamat dasar REST API; `WIKIPEDIA_REST_URL` hanya untuk tes dengan server tiruan. */
function restBase(lang: string): string {
  const override = process.env.WIKIPEDIA_REST_URL;
  return override ? `${override.replace(/\/$/, '')}/${lang}` : `https://${lang}.wikipedia.org/api/rest_v1`;
}

/**
 * null = Wikipedia tidak punya ringkasan yang layak (halaman tidak ada, disambiguasi, kosong);
 * hasil ini di-cache. Error jaringan / 5xx DILEMPAR supaya tidak ikut ter-cache.
 */
async function fetchSummary(lang: string, title: string): Promise<WikipediaSummary | null> {
  'use cache';
  cacheLife('weeks');

  const res = await fetch(`${restBase(lang)}/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status >= 400 && res.status < 500) return null;
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);

  const json = (await res.json()) as {
    type?: string;
    title?: string;
    description?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  };
  const extract = json.extract?.trim();
  if (json.type === 'disambiguation' || !extract) return null;

  return {
    title: json.title ?? title,
    lang,
    extract,
    description: json.description?.trim() || null,
    pageUrl:
      json.content_urls?.desktop?.page ??
      `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
  };
}

/** Ringkasan untuk URL Wikipedia; tidak pernah melempar (halaman tetap tampil tanpa ringkasan). */
export async function getWikipediaSummary(url: string | null): Promise<WikipediaSummary | null> {
  const ref = url ? parseWikipediaUrl(url) : null;
  if (!ref) return null;
  try {
    return await fetchSummary(ref.lang, ref.title);
  } catch {
    return null;
  }
}
