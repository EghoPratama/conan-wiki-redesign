import { NextResponse } from 'next/server';
import { CACHE_HEADERS, errorResponse } from '@/lib/wiki/http';
import { getPage } from '@/lib/wiki/queries';

/**
 * GET /api/pages/The_Crimson_Closing_Day
 * Halaman artikel generik: episode, chapter, film, volume, dst.
 * (karakter tetap di /api/characters/[name])
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    return NextResponse.json(await getPage(slug), { headers: CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}
