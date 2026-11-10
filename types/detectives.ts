// ---------------- Detective Picture Book: GET /api/detectives ----------------

/** Negara asal (dari ikon bendera di wiki) */
export interface Origin {
  /** "Japan", "United States", "United Kingdom", ... */
  name: string;
  /** SVG/PNG bendera dari wiki; null kalau tidak ada */
  flagUrl: string | null;
}

export interface Recommendation {
  title: string;
  /** Biasanya halaman Wikipedia karya tersebut */
  url: string | null;
  japanese: string | null;
  romaji: string | null;
}

export interface Detective {
  /** Nomor volume Detective Conan tempat detektif ini tampil di sampul */
  volume: number;
  volumeSlug: string | null;
  name: string;
  /** Keterangan dalam kurung, mis. "Sherlock" atau "Phoenix Wright in English localisation" */
  note: string | null;
  /** Halaman wiki detektifnya, kalau ada */
  slug: string | null;
  origin: Origin | null;
  creator: string;
  creatorSlug: string | null;
  creatorOrigin: Origin | null;
  recommendation: Recommendation;
  imageUrl: string | null;
}

export interface DetectivesData {
  total: number;
  entries: Detective[];
}
