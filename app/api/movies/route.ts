import { NextResponse } from 'next/server';
import { CACHE_HEADERS, errorResponse } from '@/lib/wiki/http';
import { getMovies } from '@/lib/wiki/queries';

/** GET /api/movies */
export async function GET() {
  try {
    return NextResponse.json(await getMovies(), { headers: CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}
