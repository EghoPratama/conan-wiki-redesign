import type { Detective } from '@/types/detectives';

/**
 * Detektif yang sudah punya artikel di wiki -> buka artikel itu (isinya lebih lengkap);
 * yang belum -> halaman detail buatan kita (/detectives/[volume]).
 */
export const detectiveHref = (d: Pick<Detective, 'slug' | 'volume'>): string =>
  d.slug ? `/wiki/${encodeURIComponent(d.slug)}` : `/detectives/${d.volume}`;
