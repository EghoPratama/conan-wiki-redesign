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

// ---------------------------------------------------------------------------
// Ringkasan TOKOH (bukan karya). Wiki Conan tidak menautkan tokoh ke Wikipedia (tautan di tabel
// hanya bendera negara), jadi artikelnya dicari lewat nama lalu diverifikasi.
// ---------------------------------------------------------------------------

/** Huruf kecil tanpa aksen/makron: "Arsène" -> "arsene", "Ōgon" -> "ogon" */
const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Kata terakhir nama, tanpa titik: "V. I. Warshawski" -> "warshawski" */
const lastToken = (name: string): string =>
  fold(name).replace(/\(.*?\)/g, '').split(/[\s.]+/).filter((t) => t.length > 1).pop() ?? '';

const CHARACTER_WORDS = /\b(fictional|character|detective|inspector|sleuth|investigator|protagonist|private eye|police|lawyer|attorney|physician|doctor)\b/;

/** Ringkasan itu memang tentang tokoh yang dimaksud, bukan artikel lain bernama mirip? */
function describesCharacter(summary: WikipediaSummary, name: string, creator: string): boolean {
  const text = fold(`${summary.title} ${summary.description ?? ''} ${summary.extract}`);
  const nameOk = text.includes(lastToken(name)) && lastToken(name).length > 2;
  if (!nameOk) return false;
  const creatorOk = creator
    .split(/,| and /)
    .map(lastToken)
    .some((t) => t.length > 2 && text.includes(t));
  return creatorOk || CHARACTER_WORDS.test(text);
}

async function searchTitles(lang: string, query: string): Promise<string[]> {
  'use cache';
  cacheLife('weeks');

  const base = process.env.WIKIPEDIA_REST_URL
    ? `${process.env.WIKIPEDIA_REST_URL.replace(/\/$/, '')}/${lang}/search/page`
    : `https://${lang}.wikipedia.org/w/rest.php/v1/search/page`;
  const res = await fetch(`${base}?q=${encodeURIComponent(query)}&limit=4`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status >= 400 && res.status < 500) return [];
  if (!res.ok) throw new Error(`Wikipedia search ${res.status}`);
  const json = (await res.json()) as { pages?: { key?: string }[] };
  return (json.pages ?? []).map((p) => p.key).filter((k): k is string => !!k);
}

async function resolveCharacter(name: string, creator: string): Promise<WikipediaSummary | null> {
  'use cache';
  cacheLife('weeks');

  // 1) judul persis = nama tokoh; 2) pencarian "<nama> <pengarang>" dan "<nama> fictional detective"
  const candidates = [name.replace(/ /g, '_')];
  for (const q of [`${name} ${creator}`, `${name} fictional detective`]) {
    for (const key of await searchTitles('en', q)) if (!candidates.includes(key)) candidates.push(key);
  }
  for (const title of candidates.slice(0, 6)) {
    const summary = await fetchSummary('en', title);
    if (summary && describesCharacter(summary, name, creator)) return summary;
  }
  return null;
}

/** Ringkasan Wikipedia tentang tokoh detektifnya; null bila tidak ketemu yang meyakinkan. */
export async function getCharacterSummary(name: string, creator: string): Promise<WikipediaSummary | null> {
  try {
    return await resolveCharacter(name, creator);
  } catch {
    return null;
  }
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
