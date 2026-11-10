/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
// Bisa di-override untuk tes lokal, mis. WIKI_API_URL=http://localhost:4010/wiki/api.php
const API_URL =
  process.env.WIKI_API_URL ?? 'https://www.detectiveconanworld.com/wiki/api.php';

// Best practice MediaWiki: kenali diri lewat User-Agent yang jelas
const USER_AGENT = 'conan-wiki-redesign/1.0 (Next.js; personal project)';

const DEFAULT_REVALIDATE = 60 * 60 * 24; // 24 jam
const TIMEOUT_MS = 10_000;

export class WikiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 502
  ) {
    super(message);
    this.name = 'WikiError';
  }
}

type Params = Record<string, string | number | boolean | undefined>;

/** Kode error MediaWiki -> HTTP status milik API kita */
const ERROR_STATUS: Record<string, number> = {
  missingtitle: 404,
  invalidtitle: 400,
  nosuchsection: 404,
  badcontinue: 400,
  invalidcategory: 400,
};

/**
 * Satu pintu untuk semua request ke MediaWiki API.
 * - query string di-encode dengan benar (URLSearchParams)
 * - timeout, User-Agent, dan cache terpusat
 * - error dari wiki dipetakan ke WikiError
 */
export async function wikiFetch<T = any>(
  params: Params,
  options: { revalidate?: number } = {}
): Promise<T> {
  const search = new URLSearchParams({ format: 'json' });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}?${search}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      next: { revalidate: options.revalidate ?? DEFAULT_REVALIDATE },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new WikiError('Wiki tidak dapat dihubungi', 504);
  }

  if (!res.ok) {
    throw new WikiError(`Wiki membalas dengan status ${res.status}`, 502);
  }

  const data = await res.json();

  if (data?.error) {
    const status = ERROR_STATUS[data.error.code] ?? 502;
    throw new WikiError(data.error.info ?? 'Wiki API error', status);
  }

  return data as T;
}
