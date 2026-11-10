/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import type { Cheerio, CheerioAPI } from 'cheerio';
import { absoluteUrl, clean, toFullImage } from './text';

/**
 * Parser infobox generik. Dipakai bersama oleh karakter, episode, film, dll.,
 * karena semuanya memakai template InfoBox yang sama di wiki ini.
 */

const LABEL_TAGS = ['th', 'dt', 'b', 'strong'];
const LABEL_SELECTOR = LABEL_TAGS.join(',');

const IGNORED_LABELS = new Set([
  'profile',
  'statistics',
  'gallery',
  'overview',
  'main page',
  'contents',
  'background',
]);

export interface InfoboxResult {
  $infobox: Cheerio<any>;
  /** Judul di kepala infobox, mis. "Episode 1214-1216 (Int. Episode 1274-1276)" */
  heading: string | null;
  imageUrl: string | null;
  profile: Record<string, string>;
}

export function parseInfobox($: CheerioAPI, pageTitle = ''): InfoboxResult {
  const $infobox = findInfobox($);

  if (process.env.WIKI_DEBUG) {
    console.log('[infobox] found:', $infobox.length);
    console.log('[infobox] html:\n', ($.html($infobox) || '').slice(0, 4000));
  }

  return {
    $infobox,
    heading: extractHeading($, $infobox),
    imageUrl: extractImage($, $infobox),
    profile: extractProfile($, $infobox, pageTitle),
  };
}

// ---------------------------------------------------------------------------
// 1. Cari container infobox (bisa <table> ATAU <div>, tergantung template)
// ---------------------------------------------------------------------------
function findInfobox($: CheerioAPI): Cheerio<any> {
  // karakter: "Japanese name", episode/film/volume: "Japanese title"
  const hasJapaneseName = (el: any) =>
    /japanese (name|title)/i.test(clean($(el).text()));
  const byTextLength = (a: any, b: any) =>
    $(a).text().length - $(b).text().length;

  // a) elemen ber-class "infobox*" yang berisi "Japanese name"
  const byClass = $('[class*="infobox" i]')
    .toArray()
    .filter(hasJapaneseName)
    .sort(byTextLength)[0];
  if (byClass) return $(byClass);

  // b) fallback: elemen TERKECIL yang memuat "Japanese name",
  //    lalu naik sampai wadah yang juga memuat "Gender" (= semua baris)
  const smallest = $('body *').toArray().filter(hasJapaneseName).sort(byTextLength)[0];
  if (!smallest) return $();

  let $cur = $(smallest);
  while ($cur.parent().length && !/gender/i.test($cur.text()) && !$cur.is('body')) {
    $cur = $cur.parent();
  }
  return $cur;
}

function extractHeading($: CheerioAPI, $infobox: Cheerio<any>): string | null {
  const $el = $infobox.children('span').first().length
    ? $infobox.children('span').first()
    : $infobox.find('th[colspan]').first();
  if (!$el.length) return null;
  const $c = $el.clone();
  $c.find('br').replaceWith(' ');
  return clean($c.text()) || null;
}

// ---------------------------------------------------------------------------
// 2. Gambar utama
// ---------------------------------------------------------------------------
function extractImage($: CheerioAPI, $infobox: Cheerio<any>): string | null {
  const $first = $infobox.find('img').first();
  const $img = $first.length ? $first : $('img').first();

  let src = $img.attr('src') || '';
  if (!src || src.startsWith('data:')) {
    // lazy-load
    src =
      $img.attr('data-src') ||
      $img.attr('srcset')?.split(',')[0]?.trim().split(' ')[0] ||
      '';
  }
  return src ? toFullImage(absoluteUrl(src)) : null;
}

// ---------------------------------------------------------------------------
// 3. Profile (key-value). Tidak peduli struktur: <tr><th><td>,
//    <td><b>Label:</b> value</td>, atau <div><b>Label:</b> value</div>
// ---------------------------------------------------------------------------
function extractProfile(
  $: CheerioAPI,
  $infobox: Cheerio<any>,
  pageTitle: string
): Record<string, string> {
  const profile: Record<string, string> = {};

  const isSeparator = (t: string) => !t || /^[:：\s]*$/.test(t);

  // teks sebuah node tanpa footnote; <br> & elemen blok = pemisah baris
  const nodeText = (node: any): string => {
    if (node.type === 'text') return node.data || '';
    const $c = $(node).clone();
    $c.find('sup, style, script, .mw-editsection').remove();
    $c.find('br').replaceWith('\n');
    $c.find('li, p, div, dd, dt, tr').each((_, e) => {
      $(e).append('\n');
    });
    return $c
      .text()
      .split('\n')
      .map(clean)
      .filter(Boolean)
      .join(', ');
  };

  $infobox.find(LABEL_SELECTOR).each((_, el: any) => {
    const tag = (el.tagName || '').toLowerCase();
    // b/strong di dalam th/dt: yang dihitung th/dt-nya saja
    if ((tag === 'b' || tag === 'strong') && $(el).parent().is('th, dt')) return;

    const label = clean($(el).text()).replace(/[:：]\s*$/, '');
    if (!label || label.length > 40) return;

    // (a) value = node setelah label, sampai ketemu label lain / <br>
    let value = '';
    let node: any = el.nextSibling;
    while (node) {
      if (node.type === 'tag') {
        const t = (node.tagName || '').toLowerCase();
        if (t === 'br' || LABEL_TAGS.includes(t)) break;
      }
      value += ' ' + nodeText(node);
      node = node.nextSibling;
    }
    value = clean(value);

    // (b) label berdiri sendiri di dalam sel -> value ada di sel sebelah
    if (isSeparator(value)) {
      let $holder = $(el);
      if (!$holder.is('th, dt')) {
        const $p = $holder.parent();
        if ($p.is('td, th, dt, div, span, p, li')) $holder = $p;
      }
      let $next = $holder.next();
      while ($next.length) {
        // wadah yang berisi label sungguhan ("Title:") = seksi berikutnya, bukan value
        const hasRealLabel =
          $next.find(LABEL_SELECTOR).filter((_, e) => /[:：]\s*$/.test($(e).text().trim()))
            .length > 0;
        if (hasRealLabel) break;
        const t = clean(nodeText($next[0]));
        if (!isSeparator(t)) {
          value = t;
          break;
        }
        $next = $next.next(); // lewati sel yang isinya cuma ":"
      }
    }

    if (value) addProfileEntry(profile, label, value, pageTitle);
  });

  return profile;
}

function addProfileEntry(
  profile: Record<string, string>,
  rawLabel: string,
  rawValue: string,
  pageTitle: string
) {
  let label = clean(rawLabel.replace(/[:：]/g, ''));
  let value = clean(
    rawValue
      .replace(/\[\d+\]/g, '') // footnote [1], [2]
      .replace(/^[:：\s]+/, '') // sisa titik dua di depan
  );

  // widget video (YouTube consent) ikut terbaca sebagai baris infobox -> buang
  if (/load video|might collect personal data/i.test(value)) return;

  // "Case" -> "Cast:, A, B" : judul seksi bercampur dengan label pertama di bawahnya
  if (/^case$/i.test(label)) {
    const m = value.match(/^([A-Za-z][A-Za-z ]{1,25}):[,\s]*(.+)$/);
    if (m) {
      label = m[1];
      value = m[2];
    }
  }

  if (
    !label ||
    !value ||
    label.length >= 40 ||
    label.toLowerCase() === value.toLowerCase() ||
    label.toLowerCase() === pageTitle.toLowerCase() ||
    IGNORED_LABELS.has(label.toLowerCase())
  ) {
    return;
  }

  // "Japanese name" -> "japaneseName"
  const key = label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');

  if (key && !profile[key]) profile[key] = value;
}
