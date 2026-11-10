export interface PageLink {
  title: string;
  /** Pakai untuk memanggil /api/pages/[slug] */
  slug: string;
}

export interface PageSection {
  id: string;
  title: string;
  /** 2 = h2, 3 = h3, 4 = h4 */
  level: number;
}

/** Kotak kasus (".infobox-crime") di halaman episode/chapter */
export interface CaseInfo {
  /** Mis. "Murder", "Kidnapping" */
  type: string;
  imageUrl: string | null;
  /** Label -> nilai, key camelCase (location, victim, causeOfDeath, suspects, ...) */
  details: Record<string, string>;
  description: string | null;
}

/** Gambar tambahan di infobox, dikelompokkan per judul (mis. "Featured Detective & Keyhole") */
export interface GallerySection {
  title: string | null;
  items: { imageUrl: string; alt: string; caption: string | null; slug: string | null }[];
}

/** Halaman artikel generik (episode, film, volume, dst.): GET /api/pages/[slug] */
export interface PageData {
  id: number;
  title: string;
  imageUrl: string | null;
  /** Judul kepala infobox, mis. "Episode 1214-1216 (Int. Episode 1274-1276)" */
  heading: string | null;
  /** Pasangan label -> value dari infobox, key camelCase (title, japaneseTitle, director, ...) */
  infobox: Record<string, string>;
  /** Navigasi episode/chapter/volume sebelum & sesudah (+ link daftar, mis. "List of Chapters"); null kalau tidak ada */
  chronology: { previous: PageLink | null; next: PageLink | null; lists: PageLink[] } | null;
  sections: PageSection[];
  /** Gambar tambahan dari infobox (selain gambar utama), mis. sampul volume: detektif & keyhole */
  gallery: GallerySection[];
  /** Kasus yang dimuat di halaman ini (kosong kalau tidak ada). HTML-nya tetap ada di `html` */
  cases: CaseInfo[];
  /** HTML artikel yang sudah dibersihkan. Spoiler: elemen [data-spoiler][hidden], tombol: [data-spoiler-toggle] */
  html: string;
}
