import { NextResponse } from 'next/server';
import { cacheControl, errorResponse } from '@/lib/wiki/http';
import { getSeason } from '@/lib/wiki/queries';

/** GET /api/anime/31 -> semua episode di season itu */
export async function GET(_request: Request, { params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  try {
    return NextResponse.json(await getSeason(Number(season)), {
      headers: cacheControl(60 * 60 * 6),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
