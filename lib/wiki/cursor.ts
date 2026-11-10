import { WikiError } from './client';

/**
 * Cursor paginasi untuk klien = token "continue" MediaWiki yang dibungkus base64url.
 * Saat di-decode, hanya key yang diizinkan yang diteruskan, sehingga klien
 * tidak bisa menyisipkan parameter lain (action, format, list, dst.) ke wiki.
 */
export function encodeCursor(cont: Record<string, string | number>): string {
  return Buffer.from(JSON.stringify(cont)).toString('base64url');
}

export function decodeCursor(
  cursor: string | null,
  allowedKeys: ReadonlySet<string>
): Record<string, string> {
  if (!cursor) return {};
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!allowedKeys.has(key)) continue;
      if (typeof value !== 'string' && typeof value !== 'number') continue;
      const str = String(value);
      if (str.length < 500) out[key] = str;
    }
    return out;
  } catch {
    throw new WikiError('Cursor tidak valid', 400);
  }
}

export function parseLimit(raw: string | null, fallback: number, max: number): number {
  const n = Number.parseInt(raw ?? '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, 1), max);
}
