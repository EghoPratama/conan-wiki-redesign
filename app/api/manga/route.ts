import { NextResponse } from 'next/server';
import { cacheControl, errorResponse } from '@/lib/wiki/http';
import { getMangaIndex } from '@/lib/wiki/queries';

/** GET /api/manga -> daftar rentang volume */
export async function GET() {
  try {
    return NextResponse.json(await getMangaIndex(), { headers: cacheControl(60 * 60 * 6) });
  } catch (error) {
    return errorResponse(error);
  }
}
