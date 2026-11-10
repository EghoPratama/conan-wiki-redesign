'use client';

import { useState } from 'react';
import styles from './WikiImage.module.css';

/**
 * Gambar dari wiki. Wiki kadang menautkan file yang sudah dihapus atau belum diunggah,
 * jadi kalau gagal dimuat tampilkan pola kosong, bukan ikon gambar rusak.
 * Wadahnya yang menentukan ukuran (aspect-ratio); gambar mengisinya.
 */
export function WikiImage({
  src,
  alt = '',
  priority = false,
  fit = 'cover',
}: {
  src: string | null;
  alt?: string;
  priority?: boolean;
  /** cover = isi wadah (dipotong); natural = tampil utuh sesuai rasio aslinya */
  fit?: 'cover' | 'natural';
}) {
  const [failed, setFailed] = useState(false);

  const natural = fit === 'natural';

  if (!src || failed) {
    return (
      <span
        className={`${styles.fallback} ${natural ? styles.fallbackNatural : ''}`}
        aria-hidden="true"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={natural ? styles.natural : styles.image}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
