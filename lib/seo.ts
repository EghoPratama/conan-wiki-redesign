import type { Metadata } from 'next';

export const SITE_NAME = 'Detective Conan Wiki';

/** Gambar pratinjau bawaan (app/opengraph-image.png). Ditulis eksplisit karena Next tidak mewariskan
 *  gambar file-convention ke halaman yang mendefinisikan `openGraph` sendiri. */
const DEFAULT_IMAGE = { url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Detective Conan Wiki' };

/**
 * Alamat situs untuk URL absolut di metadata (og:url, og:image relatif, canonical).
 * Set NEXT_PUBLIC_SITE_URL bila memakai domain sendiri; di Vercel domain produksi dipakai otomatis.
 */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(explicit || (vercel ? `https://${vercel}` : 'http://localhost:3000'));
}

/**
 * Metadata satu halaman: <title>, deskripsi, canonical, OpenGraph (pratinjau di WhatsApp/Discord/dll)
 * dan Twitter card. Tanpa `image`, gambar bawaan situs yang dipakai.
 * Next mengganti (bukan menggabung) objek `openGraph` dari layout, jadi siteName dkk. ditulis ulang di sini.
 */
export function pageMeta({
  title,
  description,
  path,
  image,
  type = 'website',
}: {
  title: string;
  description: string;
  /** Path internal, mis. "/wiki/Sherlock_Holmes" */
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: 'en_US',
      title,
      description,
      url: path,
      images: [image ? { url: image, alt: title } : DEFAULT_IMAGE],
    },
    twitter: {
      // gambar halaman biasanya sampul/potret (tegak), jadi kartu kecil; gambar bawaan situs lebar
      card: image ? 'summary' : 'summary_large_image',
      title,
      description,
      images: [image ?? DEFAULT_IMAGE.url],
    },
  };
}
