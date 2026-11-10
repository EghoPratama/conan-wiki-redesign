import { NextResponse } from 'next/server';
import { CACHE_HEADERS, errorResponse } from '@/lib/wiki/http';
import { getMusic } from '@/lib/wiki/queries';

/** GET /api/music */
export async function GET() {
  try {
    return NextResponse.json(await getMusic(), { headers: CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}
