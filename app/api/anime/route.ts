import { NextResponse } from 'next/server';
import { cacheControl, errorResponse } from '@/lib/wiki/http';
import { getAnimeIndex } from '@/lib/wiki/queries';

/** GET /api/anime -> daftar season */
export async function GET() {
  try {
    return NextResponse.json(await getAnimeIndex(), { headers: cacheControl(60 * 60 * 6) });
  } catch (error) {
    return errorResponse(error);
  }
}
