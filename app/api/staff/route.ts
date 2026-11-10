import { NextResponse } from 'next/server';
import { CACHE_HEADERS, errorResponse } from '@/lib/wiki/http';
import { getStaff } from '@/lib/wiki/queries';

/** GET /api/staff */
export async function GET() {
  try {
    return NextResponse.json(await getStaff(), { headers: CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}
