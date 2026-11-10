export type CharacterProfile = Record<string, string>;

/** Detail satu karakter: GET /api/characters/[name] */
export interface CharacterData {
  id: number;
  name: string;
  imageUrl: string | null;
  profile: CharacterProfile;
  cleanHtmlContent: string;
}

/** Item di daftar karakter: GET /api/characters */
export interface CharacterSummary {
  id: number;
  name: string;
  /** Dipakai untuk memanggil /api/characters/[slug] */
  slug: string;
  thumbnailUrl: string | null;
}

export interface Paginated<T> {
  items: T[];
  /** Kirim balik sebagai ?cursor= untuk halaman berikutnya; null = sudah habis */
  nextCursor: string | null;
}

/** Hasil pencarian: GET /api/search */
export interface SearchResult {
  id: number;
  title: string;
  slug: string;
  /** Teks polos, tanpa tag HTML */
  snippet: string;
}

export interface SearchResponse extends Paginated<SearchResult> {
  total: number | null;
}
