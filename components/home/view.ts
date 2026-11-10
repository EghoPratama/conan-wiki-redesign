import type { HomeData, LatestItem } from '@/types/home';
import { toFullImage } from '@/lib/wiki/text';

/** Nama seri yang dibaca pengguna, bukan key teknis dari parser */
const SERIES: Record<string, string> = {
  episode: 'Anime',
  chapter: 'Manga',
  'yaiba-episode': 'Yaiba',
};

export interface Released {
  id: string;
  series: string;
  label: string;
  title: string;
  /** "The Final Show" dari "The Crimson Closing Day (The Final Show)" */
  aside: string | null;
  slug: string | null;
  imageUrl: string | null;
  /** episode & Yaiba = 16:9, chapter = sampul tegak */
  shape: 'wide' | 'tall';
}

export interface Ticket {
  id: string;
  series: string;
  label: string;
  title: string;
  note: string;
  today: boolean;
}

export interface HomeView {
  latest: Released | null;
  tickets: Ticket[];
  shelf: Released[];
}

/** "TODAY!!!" -> "Today"; teks biasa dibiarkan */
export function tidyNote(note: string): string {
  const s = note.replace(/!+$/, '').trim();
  return s && s === s.toUpperCase() && /[A-Z]/.test(s) ? s.charAt(0) + s.slice(1).toLowerCase() : s;
}

/** "Title (Aside)" -> { title: "Title", aside: "Aside" } */
export function splitTitle(raw: string): { title: string; aside: string | null } {
  const m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(raw);
  return m && m[1] ? { title: m[1], aside: m[2] } : { title: raw, aside: null };
}

const toReleased = (key: string, item: LatestItem): Released => {
  const { title, aside } = splitTitle(item.title);
  return {
    id: `${key}-${item.label}`,
    series: SERIES[key] ?? key,
    label: item.label,
    title,
    aside,
    slug: item.slug,
    imageUrl: item.imageUrl,
    shape: key === 'chapter' ? 'tall' : 'wide',
  };
};

/**
 * Susun data mentah /api/home menjadi apa yang dipakai halaman:
 *  - episode terbaru = item rilis TERAKHIR di grup episode (wiki mengurutkan naik: 1216, 1217, 1218)
 *  - tiket = semua item "Next" dari tiap seri
 *  - rak = rilisan lain yang sudah keluar, yang terbaru dulu
 */
export function buildHomeView(home: HomeData): HomeView {
  const episodeGroup = home.latest.find((g) => g.key === 'episode');
  const releasedEpisodes = (episodeGroup?.items ?? []).filter((i) => i.kind === 'released');
  const newest = releasedEpisodes.at(-1) ?? null;

  const latest = newest ? toReleased('episode', newest) : null;

  const tickets: Ticket[] = home.latest.flatMap((group) =>
    group.items
      .filter((i) => i.kind === 'upcoming')
      .map((i, n) => {
        const note = tidyNote(i.note ?? '');
        return {
          id: `${group.key}-${n}`,
          series: SERIES[group.key] ?? group.heading,
          // Item tanpa label ("Season 2, Starting on ...") memakai catatannya sebagai isi tiket
          label: i.label || note,
          title: i.title,
          note: i.label ? note : '',
          today: /\btoday\b/i.test(note),
        };
      })
  );

  const olderEpisodes = releasedEpisodes.slice(0, -1).reverse();
  const shelf: Released[] = [
    ...olderEpisodes.map((i) => toReleased('episode', i)),
    ...home.latest
      .filter((g) => g.key !== 'episode')
      .flatMap((g) =>
        g.items.filter((i) => i.kind === 'released').map((i) => toReleased(g.key, i))
      ),
  ];

  return { latest, tickets, shelf };
}

/** Gambar hero tampil besar: pakai berkas aslinya, bukan thumbnail 200px */
export const heroImage = (url: string | null) => (url ? toFullImage(url) : null);
