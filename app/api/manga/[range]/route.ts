import { NextResponse } from 'next/server';
import { cacheControl, errorResponse } from '@/lib/wiki/http';
import { getVolumeRange } from '@/lib/wiki/queries';

/** GET /api/manga/101-110 -> volume + daftar chapter di rentang itu */
export async function GET(_request: Request, { params }: { params: Promise<{ range: string }> }) {
  const { range } = await params;
  try {
    return NextResponse.json(await getVolumeRange(range), {
      headers: cacheControl(60 * 60 * 6),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
