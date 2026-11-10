import { NextResponse } from 'next/server';
import { CACHE_HEADERS, errorResponse } from '@/lib/wiki/http';
import { getDetectives } from '@/lib/wiki/queries';

/** GET /api/detectives: detektif favorit Aoyama (Detective Picture Book), satu per volume */
export async function GET() {
  try {
    return NextResponse.json(await getDetectives(), { headers: CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}
