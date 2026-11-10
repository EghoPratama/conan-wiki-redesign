/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import * as cheerio from 'cheerio';
import { cacheLife } from 'next/cache';
import type {
  CharacterData,
  CharacterSummary,
  Paginated,
  SearchResponse,
} from '@/types/character';
import type { HomeData } from '@/types/home';
import type { PageData } from '@/types/page';
import type { MoviesData, MusicData, StaffData } from '@/types/extra';
import type { AnimeIndex, MangaIndex, SeasonData, VolumeRangeData } from '@/types/lists';
import { WikiError, wikiFetch } from './client';
import { decodeCursor, encodeCursor } from './cursor';
import { fetchThumbnails } from './thumbnails';
import { parseHome } from './parseHome';
import { parsePage } from './parsePage';
import { parseMovies, parseMusic, parseStaff } from './parseExtra';
import { parseAnimeIndex, parseMangaIndex, parseSeason, parseVolumeRange } from './parseLists';
import { clean, toWikiTitle } from './text';
import { parseWikiResponse } from '@/lib/wikiParser';

/**
 * Satu-satunya tempat yang tahu cara mengambil + mengurai data wiki.
 * Dipakai oleh route handler (/api/*) DAN server component, jadi halaman
 * tidak perlu memanggil API-nya sendiri lewat HTTP.
 *
 * Fungsi `load*` mengambil data apa adanya; fungsi `get*` di bagian paling bawah
 * membungkusnya dengan "use cache" (diperlukan `cacheComponents: true`).
 */

const PARSE_PARAMS = {
  action: 'parse',
  redirects: 1,
  prop: 'text',
  disableeditsection: 1,
  disabletoc: 1,
} as const;

export const HOME_REVALIDATE = 60 * 60; // berita & hitung mundur berubah harian

async function loadGetHome(): Promise<HomeData> {
  const raw = await wikiFetch(
    { ...PARSE_PARAMS, page: 'Main_Page' },
    { revalidate: HOME_REVALIDATE }
  );
  return parseHome(raw);
}

async function loadGetPage(slug: string): Promise<PageData> {
  const raw = await wikiFetch({ ...PARSE_PARAMS, page: toWikiTitle(slug) });
  return parsePage(raw);
}

async function loadGetCharacter(name: string): Promise<CharacterData> {
  const raw = await wikiFetch({ ...PARSE_PARAMS, page: toWikiTitle(name) });
  return parseWikiResponse(raw);
}

// ---------------------------------------------------------------------------
// Daftar karakter (dipakai /api/characters DAN halaman /characters)
// ---------------------------------------------------------------------------
export const DEFAULT_CATEGORY = 'Category:Characters';
export const CHARACTERS_PAGE_SIZE = 24;

// Hanya key continuation milik MediaWiki yang boleh lewat dari cursor klien
const ALLOWED_CONTINUE_KEYS = new Set(['continue', 'cmcontinue']);

export function normalizeCategory(raw: string | null | undefined): string {
  const value = (raw ?? DEFAULT_CATEGORY).trim().slice(0, 100);
  return /^category:/i.test(value) ? value : `Category:${value}`;
}

async function loadGetCharacterList(options: {
  limit?: number;
  cursor?: string | null;
  category?: string | null;
}): Promise<Paginated<CharacterSummary>> {
  const category = normalizeCategory(options.category);
  // Halaman induk kategori (mis. "Characters") ikut jadi anggota, bukan karakter
  const categoryPageTitle = category.replace(/^category:/i, '');

  // list=categorymembers menjamin urutan sesuai kategori (generator tidak)
  const data = await wikiFetch({
    action: 'query',
    list: 'categorymembers',
    cmtitle: category,
    cmtype: 'page', // tanpa subkategori
    cmnamespace: 0, // hanya artikel
    cmlimit: options.limit ?? CHARACTERS_PAGE_SIZE,
    formatversion: 2,
    ...decodeCursor(options.cursor ?? null, ALLOWED_CONTINUE_KEYS),
  });

  const members: any[] = (data.query?.categorymembers ?? []).filter(
    (m: any) => m.title !== categoryPageTitle
  );
  const thumbnails = await fetchThumbnails(members.map((m) => m.pageid));

  return {
    items: members.map((m) => ({
      id: m.pageid,
      name: m.title,
      slug: String(m.title).replace(/ /g, '_'),
      thumbnailUrl: thumbnails.get(m.pageid) ?? null,
    })),
    nextCursor: data.continue ? encodeCursor(data.continue) : null,
  };
}

// ---------------------------------------------------------------------------
// Pencarian (dipakai /api/search DAN halaman /search)
// ---------------------------------------------------------------------------
export const SEARCH_MIN_QUERY = 2;
export const SEARCH_MAX_QUERY = 100;
export const SEARCH_PAGE_SIZE = 10;
const SEARCH_REVALIDATE = 60 * 60; // hasil pencarian: 1 jam
const SEARCH_CONTINUE_KEYS = new Set(['continue', 'sroffset']);

// snippet MediaWiki berisi <span class="searchmatch"> dan entitas HTML
const snippetToText = (html: string) => clean(cheerio.load(`<p>${html}</p>`).text());

async function loadSearchWiki(
  query: string,
  options: { limit?: number; cursor?: string | null } = {}
): Promise<SearchResponse> {
  const data = await wikiFetch(
    {
      action: 'query',
      list: 'search',
      srsearch: query,
      srnamespace: 0, // hanya artikel
      srlimit: options.limit ?? SEARCH_PAGE_SIZE,
      srprop: 'snippet',
      srinfo: 'totalhits',
      formatversion: 2,
      ...decodeCursor(options.cursor ?? null, SEARCH_CONTINUE_KEYS),
    },
    { revalidate: SEARCH_REVALIDATE }
  );

  return {
    items: (data.query?.search ?? []).map((r: any) => ({
      id: r.pageid,
      title: r.title,
      slug: String(r.title).replace(/ /g, '_'),
      snippet: snippetToText(r.snippet ?? ''),
    })),
    nextCursor: data.continue ? encodeCursor(data.continue) : null,
    total: data.query?.searchinfo?.totalhits ?? null,
  };
}

// ---------------------------------------------------------------------------
// Daftar anime (season) & manga (rentang volume)
// ---------------------------------------------------------------------------
const LIST_REVALIDATE = 60 * 60 * 6; // season terbaru bertambah tiap minggu

async function loadGetAnimeIndex(): Promise<AnimeIndex> {
  return parseAnimeIndex(
    await wikiFetch({ ...PARSE_PARAMS, page: 'Anime' }, { revalidate: LIST_REVALIDATE })
  );
}

async function loadGetSeason(season: number): Promise<SeasonData> {
  if (!Number.isInteger(season) || season < 1 || season > 999) {
    throw new WikiError('Season tidak valid', 404);
  }
  return parseSeason(
    await wikiFetch({ ...PARSE_PARAMS, page: `Season_${season}` }, { revalidate: LIST_REVALIDATE }),
    season
  );
}

async function loadGetMangaIndex(): Promise<MangaIndex> {
  return parseMangaIndex(
    await wikiFetch({ ...PARSE_PARAMS, page: 'Manga' }, { revalidate: LIST_REVALIDATE })
  );
}

/** range = "101-110" */
async function loadGetVolumeRange(range: string): Promise<VolumeRangeData> {
  const m = /^(\d{1,3})-(\d{1,3})$/.exec(range);
  if (!m || Number(m[2]) <= Number(m[1])) throw new WikiError('Rentang volume tidak valid', 404);
  return parseVolumeRange(
    await wikiFetch({ ...PARSE_PARAMS, page: `Volume_${range}` }, { revalidate: LIST_REVALIDATE }),
    range
  );
}

// ---------------------------------------------------------------------------
// Movies, Music, Staff (halaman tunggal)
// ---------------------------------------------------------------------------
async function loadGetMovies(): Promise<MoviesData> {
  return parseMovies(await wikiFetch({ ...PARSE_PARAMS, page: 'Movies' }, { revalidate: LIST_REVALIDATE }));
}
async function loadGetMusic(): Promise<MusicData> {
  return parseMusic(await wikiFetch({ ...PARSE_PARAMS, page: 'Music' }, { revalidate: LIST_REVALIDATE }));
}
async function loadGetStaff(): Promise<StaffData> {
  return parseStaff(await wikiFetch({ ...PARSE_PARAMS, page: 'Staff' }, { revalidate: LIST_REVALIDATE }));
}

// ===========================================================================
// Lapisan cache ("use cache"). Ini yang dipanggil halaman & route handler.
//
// Error 4xx dari wiki (halaman tidak ada, query ditolak) dikembalikan sebagai
// NILAI supaya ikut ter-cache; error 5xx/timeout dilempar sehingga TIDAK ter-cache
// dan percobaan berikutnya mengambil ulang dari wiki.
// ===========================================================================
type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

async function attempt<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof WikiError && error.status < 500) {
      return { ok: false, status: error.status, message: error.message };
    }
    throw error;
  }
}

function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.data;
  throw new WikiError(result.message, result.status);
}

async function homeCached() {
  'use cache';
  cacheLife('hours'); // berita & hitung mundur berubah harian
  return attempt(loadGetHome);
}

async function pageCached(slug: string) {
  'use cache';
  cacheLife('days');
  return attempt(() => loadGetPage(slug));
}

async function characterCached(name: string) {
  'use cache';
  cacheLife('days');
  return attempt(() => loadGetCharacter(name));
}

async function characterListCached(limit: number, cursor: string | null, category: string | null) {
  'use cache';
  cacheLife('hours');
  return attempt(() => loadGetCharacterList({ limit, cursor, category }));
}

async function searchCached(query: string, limit: number, cursor: string | null) {
  'use cache';
  cacheLife('hours');
  return attempt(() => loadSearchWiki(query, { limit, cursor }));
}

async function animeIndexCached() {
  'use cache';
  cacheLife('hours');
  return attempt(loadGetAnimeIndex);
}

async function seasonCached(season: number) {
  'use cache';
  cacheLife('hours'); // season terbaru bertambah tiap minggu
  return attempt(() => loadGetSeason(season));
}

async function mangaIndexCached() {
  'use cache';
  cacheLife('hours');
  return attempt(loadGetMangaIndex);
}

async function volumeRangeCached(range: string) {
  'use cache';
  cacheLife('hours');
  return attempt(() => loadGetVolumeRange(range));
}

export const getHome = async (): Promise<HomeData> => unwrap(await homeCached());
export const getPage = async (slug: string): Promise<PageData> => unwrap(await pageCached(slug));
export const getCharacter = async (name: string): Promise<CharacterData> =>
  unwrap(await characterCached(name));
export const getCharacterList = async (
  options: { limit?: number; cursor?: string | null; category?: string | null } = {}
): Promise<Paginated<CharacterSummary>> =>
  unwrap(
    await characterListCached(
      options.limit ?? CHARACTERS_PAGE_SIZE,
      options.cursor ?? null,
      options.category ?? null
    )
  );
export const searchWiki = async (
  query: string,
  options: { limit?: number; cursor?: string | null } = {}
): Promise<SearchResponse> =>
  unwrap(await searchCached(query, options.limit ?? SEARCH_PAGE_SIZE, options.cursor ?? null));
export const getAnimeIndex = async (): Promise<AnimeIndex> => unwrap(await animeIndexCached());
export const getSeason = async (season: number): Promise<SeasonData> =>
  unwrap(await seasonCached(season));
export const getMangaIndex = async (): Promise<MangaIndex> => unwrap(await mangaIndexCached());
export const getVolumeRange = async (range: string): Promise<VolumeRangeData> =>
  unwrap(await volumeRangeCached(range));

async function moviesCached() {
  'use cache';
  cacheLife('days'); // jarang berubah
  return attempt(loadGetMovies);
}
async function musicCached() {
  'use cache';
  cacheLife('days');
  return attempt(loadGetMusic);
}
async function staffCached() {
  'use cache';
  cacheLife('days');
  return attempt(loadGetStaff);
}

export const getMovies = async (): Promise<MoviesData> => unwrap(await moviesCached());
export const getMusic = async (): Promise<MusicData> => unwrap(await musicCached());
export const getStaff = async (): Promise<StaffData> => unwrap(await staffCached());
