/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import * as cheerio from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { CaseInfo, GallerySection, PageData, PageLink, PageSection } from '@/types/page';
import { normalizeHtml, slugFromHref } from './html';
import { parseInfobox } from './infobox';
import { absoluteUrl, clean, toFullImage } from './text';

const LINK_BASE = '/wiki';

/** Blok "Chronology": ‹ episode sebelumnya | daftar | episode berikutnya › */
/** Versi tabel (volume/chapter): <table class="roundtable"> dengan th "Chronology", 3 sel: ‹ prev | daftar | next › */
function extractTableChronology($: CheerioAPI): PageData['chronology'] {
  const $table = $('table')
    .filter((_, el) => clean($(el).find('th').first().text()) === 'Chronology')
    .first();
  if (!$table.length) return null;

  const linkOf = ($a: any): PageLink | null => {
    const slug = slugFromHref($a.attr('href'));
    return slug ? { title: clean($a.text()), slug } : null;
  };
  const $cells = $table.find('tr').last().children('td');
  const previous = $cells.length >= 3 ? linkOf($cells.first().find('a').first()) : null;
  const next = $cells.length >= 3 ? linkOf($cells.last().find('a').first()) : null;
  const lists: PageLink[] = $cells
    .eq(1)
    .find('a')
    .toArray()
    .map((a) => linkOf($(a)))
    .filter((l): l is PageLink => !!l);

  $table.remove();
  return previous || next || lists.length ? { previous, next, lists } : null;
}

function extractChronology($: CheerioAPI): PageData['chronology'] {
  const fromTable = extractTableChronology($);
  if (fromTable) return fromTable;

  const $chron = $('div')
    .filter((_, el) => $(el).children('div').first().text().trim() === 'Chronology')
    .first();
  if (!$chron.length) return null;

  let previous: PageLink | null = null;
  let next: PageLink | null = null;

  $chron.find('i').each((_, i) => {
    const $a = $(i).find('a').first();
    const slug = slugFromHref($a.attr('href'));
    if (!slug) return;
    const link: PageLink = { title: clean($a.text()), slug };
    const around = $(i).parent().text();
    if (around.includes('‹')) previous = link;
    else if (around.includes('›')) next = link;
  });

  $chron.remove();
  return previous || next ? { previous, next, lists: [] } : null;
}

function extractSections($: CheerioAPI): PageSection[] {
  return $('h2[id], h3[id], h4[id]')
    .toArray()
    .filter((h) => !$(h).closest('#toc, .toc, .infobox').length)
    .map((h) => ({
      id: h.attribs.id,
      title: clean($(h).text()),
      level: Number(h.tagName.slice(1)),
    }))
    .filter((s) => s.title);
}

/**
 * Gambar tambahan di infobox. Judul seksi = <th> satu-sel terdekat sebelum gambar
 * ("Featured Detective & Keyhole"); caption = teks di sel gambar itu.
 */
function extractGallery($: CheerioAPI, $infobox: Cheerio<any>, mainImage: string | null): GallerySection[] {
  const sections: GallerySection[] = [];
  const seen = new Set<string>(mainImage ? [mainImage] : []);

  $('.infobox:not(.people)').add($infobox).each((_, box) => {
    let title: string | null = null;
    $(box)
      .find('th, td, caption, img')
      .each((_, el) => {
        const $el = $(el);
        if (el.tagName !== 'img') {
          // judul seksi: sel sendirian di barisnya, tanpa gambar/tabel di dalamnya, dan
          // berupa <th>/<caption>, atau <td> yang ber-colspan / berlatar warna
          const t = clean($el.text());
          if (!t || t.length > 80 || $el.find('img, table').length) return;
          const lone = el.tagName === 'caption' || $el.closest('tr').children().length === 1;
          const looksLikeHeader =
            el.tagName === 'th' ||
            el.tagName === 'caption' ||
            !!$el.attr('colspan') ||
            /background/i.test($el.attr('style') || '');
          if (lone && looksLikeHeader) title = t;
          return;
        }

        const width = Number($el.attr('width') || 0);
        const src = $el.attr('src') || $el.attr('data-src') || '';
        if (!src || src.startsWith('data:') || (width && width < 48)) return;
        const imageUrl = toFullImage(absoluteUrl(src));
        if (seen.has(imageUrl)) return;
        seen.add(imageUrl);

        const $cell = $el.closest('td, li, div');
        const single = $cell.find('img').length === 1;
        const caption = single ? clean($cell.text()) || null : null;
        const $link = single ? $cell.find('a').filter((_, a) => !!clean($(a).text())).first() : $();
        let slug = slugFromHref($link.attr('href'));
        if (slug && /^(File|Image|Special):/i.test(slug)) slug = null;

        let section = sections[sections.length - 1];
        if (!section || section.title !== title) {
          section = { title, items: [] };
          sections.push(section);
        }
        section.items.push({ imageUrl, alt: $el.attr('alt') || caption || '', caption, slug });
      });
  });

  return sections;
}

function camelKey(label: string): string {
  const words = label.replace(/:$/, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return words.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('');
}

/** Kotak kasus ".infobox-crime" -> data terstruktur (HTML aslinya dibiarkan di artikel) */
function extractCases($: CheerioAPI): CaseInfo[] {
  return $('.infobox-crime')
    .toArray()
    .map((el) => {
      const $c = $(el);
      const details: Record<string, string> = {};
      $c.find('.crime-detail').each((_, d) => {
        const $spans = $(d).children('span');
        const key = camelKey(clean($spans.first().text()));
        const value = clean($spans.slice(1).text());
        if (key && value) details[key] = value;
      });
      const src = $c.find('.crime-img-container img').first().attr('src');
      return {
        type: clean($c.find('.crime-type').first().text()),
        imageUrl: src ? absoluteUrl(src) : null,
        details,
        description: clean($c.find('.crime-description').first().text()) || null,
      };
    })
    .filter((c) => c.type || Object.keys(c.details).length);
}

export function parsePage(mwApiResponse: any): PageData {
  const parse = mwApiResponse?.parse;
  const rawHtml: string =
    parse?.text?.['*'] ?? (typeof parse?.text === 'string' ? parse.text : '');

  const $ = cheerio.load(rawHtml);
  const { $infobox, imageUrl, heading, profile } = parseInfobox($, parse?.title);

  const chronology = extractChronology($);
  const sections = extractSections($);
  const cases = extractCases($);
  const gallery = extractGallery($, $infobox, imageUrl);

  $infobox.remove();
  // kartu "People" juga ber-class infobox, tapi itu isi artikel -> jangan dibuang
  $('.infobox:not(.people), #toc, .toc, .navbox').remove();
  normalizeHtml($, $('body'), { linkBase: LINK_BASE });

  return {
    id: parse.pageid,
    title: parse.title,
    imageUrl,
    heading,
    infobox: profile,
    chronology,
    sections,
    cases,
    gallery,
    html: $('body').html() || '',
  };
}