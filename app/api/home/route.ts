import { NextResponse } from 'next/server';
import { cacheControl, errorResponse } from '@/lib/wiki/http';
import { getHome, HOME_REVALIDATE } from '@/lib/wiki/queries';

/** GET /api/home -- isi Main Page dalam bentuk terstruktur */
export async function GET() {
  try {
    return NextResponse.json(await getHome(), { headers: cacheControl(HOME_REVALIDATE) });
  } catch (error) {
    return errorResponse(error);
  }
}
