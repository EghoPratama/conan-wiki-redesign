/** Satu <li>; bisa bertingkat (mis. daftar rilis per tanggal) */
export interface ListNode {
  text: string;
  /** HTML sudah dibersihkan, link internal -> /wiki/<slug> */
  html: string;
  children: ListNode[];
}

export interface ListGroup {
  heading: string;
  items: ListNode[];
}

export interface TopicItem {
  title: string;
  slug: string | null;
  description: string;
}

export interface TopicGroup {
  heading: string;
  imageUrl: string | null;
  imageLabel: string | null;
  items: TopicItem[];
}

export interface LatestItem {
  /** released = sudah tayang/terbit, upcoming = "Next: ..." */
  kind: 'released' | 'upcoming';
  /** "Episode 1216", "File 1169" */
  label: string;
  title: string;
  /** null kalau halamannya belum ada (redlink) */
  slug: string | null;
  imageUrl: string | null;
  /** mis. "TODAY!!!", "In 25 days" */
  note: string | null;
}

export interface LatestGroup {
  /** "episode" | "chapter" | "yaiba-episode" */
  key: string;
  heading: string;
  items: LatestItem[];
}

export interface HomeData {
  articleCount: number | null;
  articleOfTheMonth: {
    title: string;
    slug: string | null;
    summary: string;
    html: string;
    imageUrl: string | null;
    caption: string | null;
  } | null;
  topics: TopicGroup[];
  news: ListGroup[];
  releases: ListGroup[];
  latest: LatestGroup[];
  didYouKnow: { imageUrl: string | null; items: { text: string; html: string }[] } | null;
}
