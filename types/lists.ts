/** Tautan ke halaman wiki lain: pakai di /wiki/[slug] */
export interface WikiLink {
  label: string;
  slug: string | null;
}

/** Catatan plot di bawah satu episode/volume, mis. "Romance: Shinichi and Ran go on a date" */
export interface PlotNote {
  tag: string | null;
  text: string;
}

export interface Episode {
  /** Nomor episode versi Jepang */
  number: number;
  /** Nomor internasional, bisa rentang ("1245-1246") */
  international: string | null;
  title: string;
  /** Mis. "1 Hour Special"; null kalau tidak ada */
  subtitle: string | null;
  /** Pakai untuk /wiki/[slug]; null kalau halaman belum ada */
  slug: string | null;
  airDate: string | null;
  dubDate: string | null;
  /** Nama ikon plot: "Romance", "Black Organization", ... */
  plot: string[];
  isOriginal: boolean;
  /** Sumber manga per baris, mis. ["V83 - F10 ~ V84 - F2"]; kosong untuk TV Original */
  mangaSource: string[];
  mangaLinks: WikiLink[];
  nextHint: string | null;
  summary: string | null;
  notes: PlotNote[];
}

/** GET /api/anime/[season] */
export interface SeasonData {
  season: number;
  title: string;
  /** Semua nomor season yang ada, untuk navigasi */
  seasons: number[];
  episodes: Episode[];
}

export interface SeasonSummary {
  season: number;
  title: string;
  /** Dari judul bagian di halaman Anime, mis. { from: 1, to: 42 }; null kalau tidak terbaca */
  episodes: { from: number; to: number | null } | null;
}

/** GET /api/anime */
export interface AnimeIndex {
  seasons: SeasonSummary[];
}

export interface Chapter {
  /** "File" atau "Chapter" (label di wiki) */
  label: string;
  number: string;
  title: string;
  slug: string | null;
  japanese: string | null;
  romaji: string | null;
  plot: string[];
}

export interface Volume {
  number: number;
  /** Pakai untuk /wiki/Volume_N */
  slug: string;
  chapters: string | null;
  japanese: { releaseDate: string | null; isbn: string | null };
  english: { releaseDate: string | null; isbn: string | null };
  plot: string[];
  chapterList: Chapter[];
  summary: string | null;
  notes: PlotNote[];
}

/** GET /api/manga/[range], mis. range = "101-110" */
export interface VolumeRangeData {
  range: string;
  title: string;
  volumes: Volume[];
}

export interface VolumeRangeSummary {
  /** "101-110" */
  range: string;
  from: number;
  to: number;
  /** Mis. "1070-????" */
  chapters: string | null;
}

/** GET /api/manga */
export interface MangaIndex {
  ranges: VolumeRangeSummary[];
}
