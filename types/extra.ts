/** Orang/halaman yang punya (atau tidak punya) halaman wiki sendiri */
export interface Named {
  name: string;
  slug: string | null;
}

// ---------------- Movies: GET /api/movies ----------------
export interface Movie {
  number: string;
  title: string;
  slug: string | null;
  releaseDate: string | null;
  dubDate: string | null;
  plot: string[];
  runtime: string | null;
  boxOffice: string | null;
}

export interface MovieGroup {
  /** "Regular movies", "Crossover movies", ... */
  title: string;
  movies: Movie[];
}

export interface MoviesData {
  groups: MovieGroup[];
}

// ---------------- Music: GET /api/music ----------------
export interface MusicCell {
  text: string;
  slug: string | null;
}

export interface MusicSection {
  /** "Opening themes", "Magic Kaito 1412 · Closing themes", ... */
  title: string;
  headers: string[];
  rows: MusicCell[][];
}

export interface MusicGroup {
  /** Seri: "Detective Conan", "Magic Kaito", ... */
  title: string;
  id: string;
  sections: MusicSection[];
}

export interface MusicData {
  groups: MusicGroup[];
}

// ---------------- Staff: GET /api/staff ----------------
export interface Actor extends Named {
  imageUrl: string | null;
}

export interface VoiceEntry {
  character: Actor;
  actors: Actor[];
  notes: string | null;
}

export interface StaffRole {
  role: string;
  people: { text: string; slug: string | null }[];
}

export interface StaffData {
  /** Pembuat manga, asisten, dst. */
  manga: { title: string; people: Named[] }[];
  /** Pengisi suara per kelompok: Main, Supporting, ... */
  voiceCast: { title: string; entries: VoiceEntry[] }[];
  /** Staf utama anime Detective Conan, per jabatan */
  mainStaff: StaffRole[];
}
