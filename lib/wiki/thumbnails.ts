import { wikiFetch } from './client';

/**
 * Wiki ini TIDAK punya ekstensi PageImages, jadi thumbnail dicari manual:
 *   1) ambil wikitext bagian pembuka (section 0, tempat infobox berada) untuk
 *      banyak halaman sekaligus, lalu cari nama file gambar infobox
 *   2) minta URL thumbnail file-file itu lewat prop=imageinfo (juga batch)
 * Total 2 request per halaman daftar, bukan 1 request per karakter.
 */

const IMAGE_EXT = '(?:png|jpe?g|gif|webp)';

// | image = Foo.png   |  | image = [[File:Foo.png|...]]
const INFOBOX_PARAM = new RegExp(
  `\\|\\s*image\\d*\\s*=\\s*(?:\\[\\[(?:File|Image):)?([^|\\]\\n}]+?\\.${IMAGE_EXT})`,
  'i'
);
// [[File:Foo.png|thumb|...]]
const FILE_LINK = new RegExp(`\\[\\[(?:File|Image):([^|\\]\\n]+?\\.${IMAGE_EXT})`, 'i');

export function extractImageFile(wikitext: string): string | null {
  const match = INFOBOX_PARAM.exec(wikitext) ?? FILE_LINK.exec(wikitext);
  return match ? match[1].trim() : null;
}

/** Bentuk kanonik judul file di MediaWiki: spasi (bukan _), huruf pertama kapital */
const canonicalFileTitle = (name: string) => {
  const n = name.replace(/_/g, ' ').trim();
  return `File:${n.charAt(0).toUpperCase()}${n.slice(1)}`;
};

/**
 * Best-effort: kalau langkah mana pun gagal, kembalikan map kosong/sebagian.
 * Daftar karakter tetap tampil, hanya tanpa gambar.
 */
export async function fetchThumbnails(
  pageIds: number[],
  width = 300
): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  if (pageIds.length === 0) return result;

  try {
    // 1) nama file gambar per halaman
    const wikitext = await wikiFetch({
      action: 'query',
      pageids: pageIds.join('|'),
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      rvsection: 0,
      formatversion: 2,
    });

    const fileByPage = new Map<number, string>();
    for (const page of wikitext.query?.pages ?? []) {
      const text: string = page.revisions?.[0]?.slots?.main?.content ?? '';
      const file = extractImageFile(text);
      if (file) fileByPage.set(page.pageid, canonicalFileTitle(file));
    }
    if (fileByPage.size === 0) return result;

    // 2) URL thumbnail per file
    const titles = [...new Set(fileByPage.values())];
    const info = await wikiFetch({
      action: 'query',
      titles: titles.join('|'),
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: width,
      redirects: 1,
      formatversion: 2,
    });

    const thumbByTitle = new Map<string, string>();
    for (const page of info.query?.pages ?? []) {
      const ii = page.imageinfo?.[0];
      const url: string | undefined = ii?.thumburl ?? ii?.url;
      if (url) thumbByTitle.set(page.title, url);
    }
    // judul yang dinormalisasi / di-redirect oleh wiki
    const alias = new Map<string, string>();
    for (const n of [...(info.query?.normalized ?? []), ...(info.query?.redirects ?? [])]) {
      alias.set(n.from, n.to);
    }

    for (const [pageId, title] of fileByPage) {
      let t = title;
      for (let i = 0; i < 3 && alias.has(t); i++) t = alias.get(t)!;
      const url = thumbByTitle.get(t);
      if (url) result.set(pageId, url);
      else if (process.env.WIKI_DEBUG) {
        // nama file ada di infobox, tapi file-nya tidak ditemukan di wiki
        console.warn(`[thumbnails] page ${pageId}: file tidak ditemukan -> ${title}`);
      }
    }
  } catch (error) {
    console.warn('[thumbnails] gagal, lanjut tanpa gambar:', error);
  }

  return result;
}
