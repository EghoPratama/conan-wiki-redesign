/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import * as cheerio from 'cheerio';
import type { Cheerio } from 'cheerio';
import type { Detective, DetectivesData, Origin, Recommendation } from '@/types/detectives';
import { slugFromHref } from './html';
import { absoluteUrl, clean, toFullImage } from './text';

/**
 * Parser halaman "Detective Picture Book".
 *
 * Struktur: satu table.wikitable, 1 baris header + 1 baris per volume, 5 sel:
 *   Volume | Featured Detective | Creator | Aoyama's Recommendation | Image
 * - sel detektif/pengarang diawali .flagicon (img alt="Flag of UK"), lalu nama
 *   (link ke wiki bila halamannya ada)
 * - rekomendasi: link (biasanya Wikipedia) + terjemahan Jepang lewat template nihongo
 *   (.t_nihongo_kanji / .t_nihongo_romaji)
 */

const htmlOf = (raw: any): string => {
  const text = raw?.parse?.text;
  return text?.['*'] ?? (typeof text === 'string' ? text : '');
};

const COUNTRY_NAMES: Record<string, string> = { US: 'United States', UK: 'United Kingdom' };

function originOf($cell: Cheerio<any>): Origin | null {
  const $img = $cell.find('.flagicon img').first();
  if (!$img.length) return null;
  const alt = clean($img.attr('alt') ?? '').replace(/^Flag of\s+/i, '');
  if (!alt) return null;
  const src = $img.attr('src');
  return { name: COUNTRY_NAMES[alt] ?? alt, flagUrl: src ? toFullImage(absoluteUrl(src)) : null };
}

/** Teks sel tanpa bendera & footnote */
function plainText($cell: Cheerio<any>): string {
  const $c = $cell.clone();
  $c.find('.flagicon, sup, style, script').remove();
  $c.find('br').replaceWith(' ');
  return clean($c.text());
}

/** "Sherlock Holmes ( Sherlock )" -> nama + keterangan */
function splitNote(text: string): { name: string; note: string | null } {
  const m = text.match(/^(.*?)\s*\(\s*(.+?)\s*\)$/);
  return m && m[1] ? { name: m[1], note: m[2] } : { name: text, note: null };
}

function internalSlug($cell: Cheerio<any>): string | null {
  const href = $cell
    .find('a[href^="/wiki/"]')
    .filter((_, a) => !/^\/wiki\/(Help|File|Special):/.test(a.attribs.href ?? ''))
    .first()
    .attr('href');
  return slugFromHref(href);
}

function recommendationOf($cell: Cheerio<any>): Recommendation {
  const $c = $cell.clone();
  const japanese = clean($c.find('.t_nihongo_kanji').first().text()) || null;
  const romaji = clean($c.find('.t_nihongo_romaji').first().text()) || null;
  $c.find('.t_nihongo_kanji, .t_nihongo_romaji, .t_nihongo_comma, .t_nihongo_help, sup').remove();

  const href = $c
    .find('a[href]')
    .filter((_, a) => !/^\/wiki\/Help:/.test(a.attribs.href ?? ''))
    .first()
    .attr('href');

  const title = clean($c.text().replace(/\(\s*[,?\s]*\)/g, '')) // sisa "( , ? )" setelah template nihongo dibuang
    .replace(/^["“”]+|["“”]+$/g, '')
    .trim();

  return { title, url: href ? absoluteUrl(href) : null, japanese, romaji };
}

export function parseDetectives(raw: any): DetectivesData {
  const $ = cheerio.load(htmlOf(raw));
  const entries: Detective[] = [];

  $('table.wikitable')
    .first()
    .find('tr')
    .each((_, tr) => {
      const $cells = $(tr).children('td');
      if ($cells.length < 5) return; // baris header

      const volume = parseInt(clean($cells.eq(0).text()), 10);
      if (!Number.isFinite(volume)) return;

      const { name, note } = splitNote(plainText($cells.eq(1)));
      const creator = plainText($cells.eq(2));
      const recommendation = recommendationOf($cells.eq(3));
      if (!name) return;

      const src = $cells.eq(4).find('img').first().attr('src');

      entries.push({
        volume,
        volumeSlug: slugFromHref($cells.eq(0).find('a[href]').first().attr('href')),
        name,
        note,
        slug: internalSlug($cells.eq(1)),
        origin: originOf($cells.eq(1)),
        creator,
        creatorSlug: internalSlug($cells.eq(2)),
        creatorOrigin: originOf($cells.eq(2)),
        recommendation,
        imageUrl: src ? toFullImage(absoluteUrl(src)) : null,
      });
    });

  if (!entries.length) throw new Error('Detective Picture Book: tabel tidak ditemukan');
  return { total: entries.length, entries };
}
