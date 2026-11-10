import { NextResponse } from 'next/server';
import { CACHE_HEADERS, errorResponse } from '@/lib/wiki/http';
import { parseLimit } from '@/lib/wiki/cursor';
import { CHARACTERS_PAGE_SIZE, getCharacterList } from '@/lib/wiki/queries';

const MAX_LIMIT = 50; // batas cmlimit untuk akun non-bot

/**
 * GET /api/characters?category=Category:Characters&limit=24&cursor=...
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  try {
    const body = await getCharacterList({
      limit: parseLimit(sp.get('limit'), CHARACTERS_PAGE_SIZE, MAX_LIMIT),
      cursor: sp.get('cursor'),
      category: sp.get('category'),
    });
    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}
