/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import * as cheerio from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type {
  Actor,
  MoviesData,
  MusicData,
  MusicGroup,
  Named,
  StaffData,
  StaffRole,
  VoiceEntry,
} from '@/types/extra';
import { slugFromHref } from './html';
import { absoluteUrl, clean } from './text';

/** Parser halaman Movies, Music, dan Staff. */

const htmlOf = (raw: any): string => {
  const text = raw?.parse?.text;
  return text?.['*'] ?? (typeof text === 'string' ? text : '');
};

/** Teks sel: footnote dibuang, <br> jadi spasi */
function cellText($cell: Cheerio<any>): string {
  const $c = $cell.clone();
  $c.find('sup, style, script, .Template-code').remove();
  $c.find('br').replaceWith(' ');
  return clean($c.text());
}

const firstSlug = ($cell: Cheerio<any>) => slugFromHref($cell.find('a[href]').first().attr('href'));

function plotNames($: CheerioAPI, $cell: Cheerio<any>): string[] {
  const names = $cell
    .find('img')
    .toArray()
    .map((img) => clean($(img).attr('alt') ?? ''))
    .filter(Boolean);
  return [...new Set(names)];
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ---------------------------------------------------------------------------
// Movies: beberapa table.movietable, tiap tabel di bawah heading-nya sendiri
// ---------------------------------------------------------------------------
export function parseMovies(raw: any): MoviesData {
  const $ = cheerio.load(htmlOf(raw));
  const groups: MoviesData['groups'] = [];
  let heading = 'Movies';

  $('h2, h3, h4, table.movietable').each((_, el) => {
    const $el = $(el);
    if (!$el.is('table')) {
      heading = clean($el.text()) || heading;
      return;
    }

    const movies = $el
      .children('tbody')
      .children('tr')
      .toArray()
      .map((tr) => $(tr).children('td'))
      .filter(($c) => $c.length >= 7)
      .map(($c) => {
        const $a = $c.eq(1).find('a').first();
        return {
          number: cellText($c.eq(0)),
          title: cellText($c.eq(1)),
          slug: slugFromHref($a.attr('href')),
          releaseDate: cellText($c.eq(2)) || null,
          dubDate: cellText($c.eq(3)) || null,
          plot: plotNames($, $c.eq(4)),
          runtime: cellText($c.eq(5)) || null,
          boxOffice: cellText($c.eq(6)) || null,
        };
      });

    if (movies.length) groups.push({ title: heading, movies });
  });

  return { groups };
}

// ---------------------------------------------------------------------------
// Music: table.musictable di bawah h2 (seri) > h3 > h4
// ---------------------------------------------------------------------------
export function parseMusic(raw: any): MusicData {
  const $ = cheerio.load(htmlOf(raw));
  const groups: MusicGroup[] = [];
  let series: MusicGroup | null = null;
  let h3 = '';
  let h4 = '';

  $('h2, h3, h4, table.musictable').each((_, el) => {
    const $el = $(el);
    const tag = (el as any).tagName?.toLowerCase();

    if (tag === 'h2') {
      const title = clean($el.text());
      h3 = h4 = '';
      series = null;
      // "Contents", "References" bukan seri
      if (title && !/^(contents|references)$/i.test(title)) {
        series = { title, id: slugify(title), sections: [] };
        groups.push(series);
      }
      return;
    }
    if (tag === 'h3') {
      h3 = clean($el.text());
      h4 = '';
      return;
    }
    if (tag === 'h4') {
      h4 = clean($el.text());
      return;
    }
    if (!series) return;

    const $rows = $el.children('tbody').children('tr');
    const headers = $rows
      .first()
      .children('th, td')
      .toArray()
      .map((c) => cellText($(c)));
    const rows = $rows
      .toArray()
      .slice(1)
      .map((tr) => $(tr).children('td'))
      .filter(($c) => $c.length > 1 && !$c.first().attr('colspan'))
      .map(($c) =>
        $c.toArray().map((c) => ({ text: cellText($(c)), slug: firstSlug($(c)) }))
      );

    if (rows.length) {
      series.sections.push({
        title: [h3, h4].filter(Boolean).join(' · ') || series.title,
        headers,
        rows,
      });
    }
  });

  // Judul kembar ("Insert Songs" untuk episode & untuk movie) dibedakan supaya bisa dibaca & jadi key
  for (const g of groups) {
    const byTitle = new Map<string, typeof g.sections>();
    for (const sec of g.sections) byTitle.set(sec.title, [...(byTitle.get(sec.title) ?? []), sec]);
    for (const [title, list] of byTitle) {
      if (list.length < 2) continue;
      const hints = list.map((sec) => sec.headers[1] ?? '');
      const distinct = new Set(hints).size === list.length && hints.every(Boolean);
      list.forEach((sec, i) => {
        sec.title = `${title} (${distinct ? hints[i] : i + 1})`;
      });
    }
  }

  return { groups: groups.filter((g) => g.sections.length) };
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
function person($: CheerioAPI, $cell: Cheerio<any>, $img?: Cheerio<any>): Actor {
  const src = $img?.find('img').first().attr('src') ?? '';
  return {
    name: cellText($cell),
    slug: firstSlug($cell),
    imageUrl: src ? absoluteUrl(src) : null,
  };
}

function namedFromList($: CheerioAPI, $scope: Cheerio<any>): Named[] {
  return $scope
    .find('li')
    .toArray()
    .map((li) => ({ name: cellText($(li)), slug: firstSlug($(li)) }))
    .filter((p) => p.name);
}

export function parseStaff(raw: any): StaffData {
  const $ = cheerio.load(htmlOf(raw));
  const out: StaffData = { manga: [], voiceCast: [], mainStaff: [] };

  let h2 = '';
  let h3 = '';
  let h4 = '';
  let role: StaffRole | null = null;

  $('.mw-parser-output')
    .first()
    .children()
    .each((_, el) => {
      const $el = $(el);

      // heading: <div class="mw-heading mw-headingN"><hN>
      if ($el.is('.mw-heading')) {
        const level = Number(/mw-heading(\d)/.exec($el.attr('class') ?? '')?.[1]);
        const title = clean($el.find('h2, h3, h4, h5').first().text());
        if (level === 2) [h2, h3, h4] = [title, '', ''];
        else if (level === 3) [h3, h4] = [title, ''];
        else if (level === 4) h4 = title;
        role = null;
        return;
      }

      // ---- Manga: daftar nama per sub-judul
      if (/^manga$/i.test(h2) && h3 && ($el.is('ul') || $el.is('.columns-list'))) {
        const people = namedFromList($, $el);
        const last = out.manga.at(-1);
        if (last?.title === h3) last.people.push(...people);
        else out.manga.push({ title: h3, people });
        return;
      }

      // ---- Pengisi suara: table.chartable per kelompok (Main, Supporting, ...)
      if ($el.is('table.chartable') && /voice cast/i.test(h3)) {
        const entries: VoiceEntry[] = [];
        $el
          .children('tbody')
          .children('tr')
          .each((_, tr) => {
            const $c = $(tr).children('td');
            if (!$c.length) return; // baris header
            if ($c.length >= 5) {
              entries.push({
                character: person($, $c.eq(1), $c.eq(0)),
                actors: [person($, $c.eq(3), $c.eq(2))],
                notes: cellText($c.eq(4)) || null,
              });
            } else if (entries.length) {
              // karakter dengan lebih dari satu pengisi suara (rowspan)
              const current = entries[entries.length - 1];
              current.actors.push(person($, $c.eq(1), $c.eq(0)));
              if ($c.length >= 3 && !current.notes) current.notes = cellText($c.eq(2)) || null;
            }
          });
        out.voiceCast.push({ title: h4 || 'Cast', entries });
        return;
      }

      // ---- Staf utama: hanya bagian "Detective Conan" (lainnya punya halaman sendiri)
      if (/main staff/i.test(h3) && h4 === 'Detective Conan') {
        if ($el.is('ul')) {
          $el.children('li').each((_, li) => {
            const $li = $(li);
            const $b = $li.children('b').first();
            if ($b.length) {
              role = { role: clean($b.text()).replace(/\s*:\s*$/, ''), people: [] };
              out.mainStaff.push(role);
              const $rest = $li.clone();
              $rest.children('b').first().remove();
              const text = cellText($rest).replace(/^\s*:\s*/, '');
              if (text) role.people.push({ text, slug: firstSlug($li.clone().children('b').remove().end()) });
            } else if (role) {
              role.people.push({ text: cellText($li), slug: firstSlug($li) });
            }
          });
        } else if ($el.is('dl') && role) {
          const $items = $el.find('li');
          if ($items.length) {
            $items.each((_, li) => {
              role!.people.push({ text: cellText($(li)), slug: firstSlug($(li)) });
            });
          } else {
            $el.find('dd').each((_, dd) => {
              const text = cellText($(dd));
              if (text) role!.people.push({ text, slug: firstSlug($(dd)) });
            });
          }
        }
      }
    });

  return out;
}
