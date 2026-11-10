import { NextResponse } from 'next/server';
import { parseLimit } from '@/lib/wiki/cursor';
import { cacheControl, errorResponse } from '@/lib/wiki/http';
import {
  SEARCH_MAX_QUERY,
  SEARCH_MIN_QUERY,
  SEARCH_PAGE_SIZE,
  searchWiki,
} from '@/lib/wiki/queries';

const MAX_LIMIT = 50;

/**
 * GET /api/search?q=conan&limit=10&cursor=...
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const q = (sp.get('q') ?? '').trim();

  if (q.length < SEARCH_MIN_QUERY || q.length > SEARCH_MAX_QUERY) {
    return NextResponse.json(
      { error: `Parameter q wajib diisi (${SEARCH_MIN_QUERY}-${SEARCH_MAX_QUERY} karakter)` },
      { status: 400 }
    );
  }

  try {
    const body = await searchWiki(q, {
      limit: parseLimit(sp.get('limit'), SEARCH_PAGE_SIZE, MAX_LIMIT),
      cursor: sp.get('cursor'),
    });
    return NextResponse.json(body, { headers: cacheControl(60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
