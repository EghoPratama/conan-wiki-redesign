export const BASE_URL = 'https://www.detectiveconanworld.com';

// nbsp (U+00A0) dan zero-width space (U+200B); ditulis lewat kode karakter
// supaya tidak ada karakter tak terlihat di source
const SPECIAL_SPACES = new RegExp(
  `[${String.fromCharCode(0x00a0)}${String.fromCharCode(0x200b)}]`,
  'g'
);

/** Normalisasi spasi khusus SETELAH di-decode cheerio. */
export const clean = (s: string): string =>
  s.replace(SPECIAL_SPACES, ' ').replace(/\s+/g, ' ').trim();

export const absoluteUrl = (src: string): string => {
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `${BASE_URL}${src}`;
  return src;
};

/** /wiki/images/thumb/2/28/X.jpg/200px-X.jpg -> /wiki/images/2/28/X.jpg */
export const toFullImage = (url: string): string =>
  url.replace(/\/images\/thumb\/(.+?\/[^/]+)\/[^/]+$/, '/images/$1');

/** "Conan Edogawa" -> "Conan_Edogawa" */
export const toWikiTitle = (name: string): string =>
  name.trim().replace(/\s+/g, '_');

/** Potong di batas kata dan beri elipsis */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6))}…`;
}

