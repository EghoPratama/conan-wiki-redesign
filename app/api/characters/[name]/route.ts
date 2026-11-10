import { NextResponse } from 'next/server';
import { CACHE_HEADERS, errorResponse } from '@/lib/wiki/http';
import { getCharacter } from '@/lib/wiki/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  try {
    return NextResponse.json(await getCharacter(name), { headers: CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}
