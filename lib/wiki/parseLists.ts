/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import * as cheerio from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type {
  AnimeIndex,
  Chapter,
  Episode,
  MangaIndex,
  PlotNote,
  SeasonData,
  SeasonSummary,
  Volume,
  VolumeRangeData,
  VolumeRangeSummary,
  WikiLink,
} from '@/types/lists';
import { slugFromHref } from './html';
import { clean } from './text';

/** Parser halaman daftar: season anime, rentang volume manga, dan halaman indeksnya. */

const htmlOf = (raw: any): string => {
  const text = raw?.parse?.text;
  return text?.['*'] ?? (typeof text === 'string' ? text : '');
};

/** Teks sel dengan <br> sebagai pemisah baris; footnote dibuang */
function lines($cell: Cheerio<any>): string[] {
  const $c = $cell.clone();
  $c.find('sup, style, script').remove();
  $c.find('br').replaceWith('\n');
  return $c
    .text()
    .split('\n')
    .map(clean)
    .filter(Boolean);
}

const text = ($cell: Cheerio<any>) => clean(lines($cell).join(' ')) || null;

/** Nama ikon plot (alt gambar): "Romance", "Black Organization", ... */
function plotNames($: CheerioAPI, $cell: Cheerio<any>): string[] {
  const names = $cell
    .find('img')
    .toArray()
    .map((img) => clean($(img).attr('alt') ?? ''))
    .filter(Boolean);
  return [...new Set(names)];
}

/** Tabel kecil berisi catatan plot: <td><img alt="Romance"> <i>teks</i></td> */
function plotNotes($: CheerioAPI, $scope: Cheerio<any>, skip: (td: Cheerio<any>) => boolean): PlotNote[] {
  const notes: PlotNote[] = [];
  $scope.find('td').each((_, td) => {
    const $td = $(td);
    if ($td.find('td').length || skip($td)) return; // hanya sel paling dalam
    const tag = clean($td.find('img').first().attr('alt') ?? '') || null;
    const body = text($td);
    if (body) notes.push({ tag, text: body });
  });
  return notes;
}

/** Baris sinopsis (td[colspan]): teks + tabel catatan plot di dalamnya */
function readSummary($: CheerioAPI, $row: Cheerio<any>): { summary: string | null; notes: PlotNote[] } {
  const $cell = $row.children('td[colspan]').first();
  if (!$cell.length) return { summary: null, notes: [] };
  const $body = $cell.clone();
  $body.find('table').remove();
  const body = text($body);
  return {
    summary: body && !/^no summary yet\.?$/i.test(body) ? body : null,
    notes: plotNotes($, $cell, () => false),
  };
}

// ---------------------------------------------------------------------------
// Anime: halaman "Season N"
// ---------------------------------------------------------------------------
export function parseSeason(raw: any, season: number): SeasonData {
  const $ = cheerio.load(htmlOf(raw));

  const seasons = [
    ...new Set([
      season, // season yang sedang dibuka tidak punya link ke dirinya sendiri
      ...$('a[href]')
        .toArray()
        .map((a) => /^\/wiki\/Season_(\d+)$/.exec($(a).attr('href') ?? '')?.[1])
        .filter((n): n is string => !!n)
        .map(Number),
    ]),
  ].sort((a, b) => a - b);

  const episodes: Episode[] = [];
  $('table.seasontable')
    .first()
    .children('tbody')
    .children('tr')
    .each((_, tr) => {
      const $tr = $(tr);
      const $cells = $tr.children('td');
      if ($cells.length < 8 || $cells.first().attr('colspan')) return;

      const number = Number.parseInt(clean($cells.eq(0).text()), 10);
      if (Number.isNaN(number)) return;

      const $a = $cells.eq(2).find('a').first();
      const $title = $a.length ? $a : $cells.eq(2);
      const $titleCopy = $title.clone();
      $titleCopy.find('small').remove();
      const subtitle = clean($title.find('small').text()).replace(/^\(|\)$/g, '') || null;

      const mangaLines = lines($cells.eq(6));
      const mangaLinks: WikiLink[] = $cells
        .eq(6)
        .find('a')
        .toArray()
        .map((a) => ({ label: clean($(a).text()), slug: slugFromHref($(a).attr('href')) }))
        .filter((l) => l.label);

      // baris berikutnya (colspan) = sinopsis + catatan plot
      const { summary, notes } = readSummary($, $tr.next('tr'));

      episodes.push({
        number,
        international: text($cells.eq(1)),
        title: clean($titleCopy.text()),
        subtitle,
        slug: slugFromHref($a.attr('href')),
        airDate: text($cells.eq(3)),
        dubDate: text($cells.eq(4)),
        plot: plotNames($, $cells.eq(5)),
        isOriginal: /tv original/i.test(mangaLines.join(' ')),
        mangaSource: /tv original/i.test(mangaLines.join(' ')) ? [] : mangaLines,
        mangaLinks,
        nextHint: text($cells.eq(7)),
        summary,
        notes,
      });
    });

  return { season, title: `Season ${season}`, seasons, episodes };
}

// ---------------------------------------------------------------------------
// Anime: halaman "Anime" (daftar season)
// ---------------------------------------------------------------------------
export function parseAnimeIndex(raw: any): AnimeIndex {
  const $ = cheerio.load(htmlOf(raw));

  const numbers = [
    ...new Set(
      $('a[href]')
        .toArray()
        .map((a) => /^\/wiki\/Season_(\d+)$/.exec($(a).attr('href') ?? '')?.[1])
        .filter((n): n is string => !!n)
        .map(Number)
    ),
  ].sort((a, b) => a - b);

  // Judul bagian: "Season 1 - Episodes 1-42"
  const ranges = new Map<number, SeasonSummary['episodes']>();
  $('h2, h3, h4').each((_, h) => {
    const m = /Season\s+(\d+)\s*[-–—]\s*Episodes?\s+(\d+)\s*[-–—]\s*(\d+)?/i.exec(clean($(h).text()));
    if (m) ranges.set(Number(m[1]), { from: Number(m[2]), to: m[3] ? Number(m[3]) : null });
  });

  return {
    seasons: numbers.map((season) => ({
      season,
      title: `Season ${season}`,
      episodes: ranges.get(season) ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Manga: halaman "Volume A-B"
// ---------------------------------------------------------------------------
const CHAPTER_LABEL = /^(File|Chapter)\s+([^:\s]+)\s*:/i;

function parseChapter($: CheerioAPI, td: any): Chapter | null {
  const $td = $(td);
  const label = CHAPTER_LABEL.exec(clean($td.text()));
  if (!label) return null;

  const $a = $td.children('a').first();
  const title = clean($a.text()) || clean($td.text().replace(CHAPTER_LABEL, '').split('(')[0]);
  return {
    label: label[1],
    number: label[2],
    title,
    slug: slugFromHref($a.attr('href')),
    japanese: clean($td.find('.t_nihongo_kanji').text()) || null,
    romaji: clean($td.find('.t_nihongo_romaji').text()) || null,
    plot: plotNames($, $td),
  };
}

export function parseVolumeRange(raw: any, range: string): VolumeRangeData {
  const $ = cheerio.load(htmlOf(raw));
  const volumes: Volume[] = [];

  $('table.volumetable')
    .first()
    .children('tbody')
    .children('tr')
    .each((_, tr) => {
      const $tr = $(tr);
      const $cells = $tr.children('td');
      const href = $cells.first().find('a').first().attr('href') ?? '';
      const m = /^\/wiki\/Volume_(\d+)$/.exec(href);
      if (!m || $cells.length < 6) return;

      const isbn = ($c: Cheerio<any>) => text($c)?.replace(/^ISBN\s*/i, '') || null;

      // baris berikutnya (colspan) = daftar chapter + catatan plot
      const $details = $tr.next('tr').children('td[colspan]').first();
      const chapterList: Chapter[] = [];
      $details.find('td').each((_, td) => {
        if ($(td).find('td').length) return;
        const chapter = parseChapter($, td);
        if (chapter) chapterList.push(chapter);
      });

      // dua baris setelah baris volume = sinopsis + catatan plot
      const volumeSummary = readSummary($, $tr.next('tr').next('tr'));

      volumes.push({
        number: Number(m[1]),
        slug: `Volume_${m[1]}`,
        chapters: text($cells.eq(1)),
        japanese: { releaseDate: text($cells.eq(2)), isbn: isbn($cells.eq(3)) },
        english: { releaseDate: text($cells.eq(4)), isbn: isbn($cells.eq(5)) },
        plot: plotNames($, $cells.eq(6)),
        chapterList,
        summary: volumeSummary.summary,
        notes: volumeSummary.notes,
      });
    });

  return { range, title: `Volume ${range}`, volumes };
}

// ---------------------------------------------------------------------------
// Manga: halaman "Manga" (daftar rentang volume)
// ---------------------------------------------------------------------------
export function parseMangaIndex(raw: any): MangaIndex {
  const $ = cheerio.load(htmlOf(raw));

  const found = new Map<string, VolumeRangeSummary>();
  $('a[href]').each((_, a) => {
    const m = /^\/wiki\/Volume_(\d+)-(\d+)$/.exec($(a).attr('href') ?? '');
    if (!m) return;
    const [from, to] = [Number(m[1]), Number(m[2])];
    if (to <= from) return;
    found.set(`${from}-${to}`, { range: `${from}-${to}`, from, to, chapters: null });
  });

  // Judul bagian: "Volume 101-110 - Chapters 1070-????"
  $('h2, h3, h4').each((_, h) => {
    const m = /Volume\s+(\d+)\s*[-–—]\s*(\d+)\s*[-–—]\s*Chapters?\s+(\S+)/i.exec(clean($(h).text()));
    const entry = m && found.get(`${m[1]}-${m[2]}`);
    if (entry && m) entry.chapters = m[3];
  });

  return { ranges: [...found.values()].sort((a, b) => a.from - b.from) };
}
