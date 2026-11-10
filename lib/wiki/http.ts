import { NextResponse } from 'next/server';
import { WikiError } from './client';

/** Header cache CDN: segar `sMaxAge` detik, boleh basi sampai 7 hari saat revalidate di background */
export const cacheControl = (sMaxAge: number) => ({
  'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=604800`,
});

/** Konten wiki jarang berubah: 1 hari */
export const CACHE_HEADERS = cacheControl(86400);

export function errorResponse(error: unknown) {
  if (error instanceof WikiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error('[api] unexpected error:', error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
