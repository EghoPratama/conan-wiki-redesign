/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import * as cheerio from 'cheerio';
import type { CharacterData } from '@/types/character';
import { parseInfobox } from '@/lib/wiki/infobox';
import { normalizeHtml } from '@/lib/wiki/html';

export function parseWikiResponse(mwApiResponse: any): CharacterData {
  const parse = mwApiResponse?.parse;
  // formatversion=1 -> text['*'], formatversion=2 -> text (string)
  const rawHtml: string = parse?.text?.['*'] ?? (typeof parse?.text === 'string' ? parse.text : '');

  const $ = cheerio.load(rawHtml);
  const { $infobox, imageUrl, profile } = parseInfobox($, parse?.title);

  // Bersihkan HTML artikel utama
  $infobox.remove();
  $('.infobox:not(.people), .toc, .navbox').remove();
  normalizeHtml($, $('body'), { linkBase: '/characters' });

  return {
    id: parse.pageid,
    name: parse.title,
    imageUrl,
    profile,
    cleanHtmlContent: $('body').html() || '',
  };
}
