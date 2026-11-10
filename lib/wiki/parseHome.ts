/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import * as cheerio from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type {
  HomeData,
  LatestGroup,
  LatestItem,
  ListGroup,
  ListNode,
  TopicGroup,
} from '@/types/home';
import { imageSrc, normalizeHtml, slugFromHref } from './html';
import { clean } from './text';

const LINK_BASE = '/wiki';

/** HTML (dibersihkan) + teks polos dari sebuah elemen, tanpa mengubah dokumen asli */
function htmlAndText($: CheerioAPI, $el: Cheerio<any>) {
  const $clone = $el.clone();
  normalizeHtml($, $clone, { linkBase: LINK_BASE });
  return { html: ($clone.html() ?? '').trim(), text: clean($clone.text()) };
}

function parseListNodes($: CheerioAPI, $list: Cheerio<any>): ListNode[] {
  return $list
    .children('li')
    .toArray()
    .map((li) => {
      const $li = $(li);
      const $own = $li.clone();
      $own.children('ul, ol').remove();
      const { html, text } = htmlAndText($, $own);
      const children = $li
        .children('ul, ol')
        .toArray()
        .flatMap((nested) => parseListNodes($, $(nested)));
      return { text, html, children };
    });
}

/** <p>judul</p><ul>…</ul><hr><ul>…</ul> -> [{heading, items}] */
function parseGroups($: CheerioAPI, $container: Cheerio<any>): ListGroup[] {
  const groups: ListGroup[] = [];
  $container.children().each((_, el: any) => {
    if (el.tagName === 'p') {
      const heading = clean($(el).text());
      if (heading) groups.push({ heading, items: [] });
    } else if (el.tagName === 'ul' || el.tagName === 'ol') {
      if (groups.length === 0) groups.push({ heading: '', items: [] });
      groups[groups.length - 1].items.push(...parseListNodes($, $(el)));
    }
  });
  return groups.filter((g) => g.items.length > 0);
}

/** Isi <td> tepat di bawah <h2> dengan teks tertentu (tabel #mp-left / #mp-right) */
function sectionCell($: CheerioAPI, heading: string): Cheerio<any> {
  return $('h2')
    .filter((_, h) => clean($(h).text()) === heading)
    .first()
    .closest('tr')
    .next('tr')
    .children('td')
    .first();
}

function parseTopics($: CheerioAPI, heading: string): TopicGroup | null {
  const $td = sectionCell($, heading);
  if (!$td.length) return null;

  const $box = $td.find('table.wikitable').first();
  const items = $td
    .children('ul')
    .children('li')
    .toArray()
    .map((li) => {
      const $li = $(li);
      const $a = $li.find('a').first();
      const title = clean($a.text());
      const description = clean($li.text())
        .replace(title, '')
        .replace(/^[\s\-–—:]+/, '');
      return { title, slug: slugFromHref($a.attr('href')), description };
    })
    .filter((i) => i.title);

  return {
    heading,
    imageUrl: $box.find('img').first().length ? imageSrc($box.find('img').first()) : null,
    imageLabel: clean($box.find('tr').last().text()) || null,
    items,
  };
}

function parseArticleOfTheMonth($: CheerioAPI): HomeData['articleOfTheMonth'] {
  const $td = sectionCell($, 'Article of the Month');
  if (!$td.length) return null;

  const $p = $td.find('p').first();
  const title = clean($p.find('b').first().text());
  if (!title) return null;

  const $readMore = $p.find('a').filter((_, a) => /read more/i.test($(a).text())).first();
  const slug = slugFromHref($readMore.attr('href'));

  const $summary = $p.clone();
  $summary.find('b').filter((_, b) => /read more/i.test($(b).text())).remove();
  const { html, text } = htmlAndText($, $summary);

  const $img = $td.find('figure img').first();
  return {
    title,
    slug,
    summary: text,
    html,
    imageUrl: $img.length ? imageSrc($img) : null,
    caption: clean($td.find('figcaption').first().text()) || null,
  };
}

const NEXT_PREFIX = /^Next:\s*/i;
const trimSeparators = (s: string) => s.replace(/^[,\s]+|[,\s]+$/g, '');

function parseLatestItem($: CheerioAPI, el: any): LatestItem | null {
  const $item = $(el);
  const $img = $item.find('figure img').first();
  // anchor pertama biasanya hanya membungkus gambar; yang berisi label (<b>) ada di anchor lain
  const $labelled = $item.find('a').filter((_, a) => $(a).find('b').length > 0).first();
  const $a = $labelled.length ? $labelled : $item.find('a').first();
  const slug = slugFromHref($a.attr('href'));

  if ($img.length) {
    const label = clean($a.find('b').first().text());
    return {
      kind: 'released',
      label,
      title: clean($a.text()).replace(label, '').replace(/^[\s:]+/, ''),
      slug,
      imageUrl: imageSrc($img),
      note: null,
    };
  }

  // "Next: Episode 1219: <judul> <br> TODAY!!!" / "Next: File 1170 <br> In 25 days"
  const $p = $item.find('p').first();
  if (!$p.length) return null;

  const labelCandidate = clean($p.find('b').first().text());
  const label = /^next:?$/i.test(labelCandidate) ? '' : labelCandidate;
  const title = $a.length ? clean($a.text()).replace(label, '').replace(/^[\s:]+/, '') : '';

  const $rest = $p.clone();
  $rest.find('a').remove();
  if (label) $rest.find('b').filter((_, b) => clean($(b).text()) === label).first().remove();
  $rest.find('br').replaceWith(', ');
  const note = trimSeparators(
    clean($rest.text()).replace(/\s+,/g, ',').replace(NEXT_PREFIX, '')
  );

  return { kind: 'upcoming', label, title, slug, imageUrl: null, note: note || null };
}

function parseLatest($: CheerioAPI): LatestGroup[] {
  return $('b')
    .filter((_, b) => /^Latest\b/i.test(clean($(b).text())) && $(b).parent().is('div'))
    .toArray()
    .map((b) => {
      const heading = clean($(b).text());
      const items = $(b)
        .parent()
        .next('div')
        .find('.LnBox-item, .LnBox-item-show')
        .toArray()
        .map((el) => parseLatestItem($, el))
        .filter((i): i is LatestItem => i !== null);
      const key = heading
        .toLowerCase()
        .replace(/^latest\s+/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return { key, heading, items };
    })
    .filter((g) => g.items.length > 0);
}

function parseDidYouKnow($: CheerioAPI): HomeData['didYouKnow'] {
  const $b = $('b').filter((_, b) => /^Did you know/i.test(clean($(b).text()))).first();
  if (!$b.length) return null;

  const $box = $b.parent().next('div');
  const items = $box
    .find('li')
    .toArray()
    .map((li) => {
      const { html, text } = htmlAndText($, $(li));
      return {
        text: text.replace(/^\.{3}\s*/, ''),
        html: html.replace(/^\.{3}\s*/, ''),
      };
    })
    .filter((i) => i.text);

  const $img = $box.find('figure img').first();
  return { imageUrl: $img.length ? imageSrc($img) : null, items };
}

export function parseHome(mwApiResponse: any): HomeData {
  const parse = mwApiResponse?.parse;
  const rawHtml: string =
    parse?.text?.['*'] ?? (typeof parse?.text === 'string' ? parse.text : '');
  const $ = cheerio.load(rawHtml);

  const count = Number.parseInt(clean($('#articlecount a').first().text()).replace(/,/g, ''), 10);

  return {
    articleCount: Number.isNaN(count) ? null : count,
    articleOfTheMonth: parseArticleOfTheMonth($),
    topics: [parseTopics($, 'General topics'), parseTopics($, 'Specific topics')].filter(
      (t): t is TopicGroup => t !== null
    ),
    news: parseGroups($, sectionCell($, 'Latest news')),
    releases: parseGroups($, sectionCell($, 'Release news')),
    latest: parseLatest($),
    didYouKnow: parseDidYouKnow($),
  };
}
