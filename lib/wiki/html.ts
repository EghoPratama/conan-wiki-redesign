/* eslint-disable @typescript-eslint/no-explicit-any -- JSON MediaWiki dan node HTML (cheerio) tidak bertipe; divalidasi lewat parser */
import type { Cheerio, CheerioAPI } from 'cheerio';
import { absoluteUrl } from './text';

/** "/wiki/Foo_Bar%27s#Sec" -> "Foo_Bar's". null untuk link non-artikel (redlink, index.php, eksternal). */
export function slugFromHref(href: string | undefined): string | null {
  if (!href || !href.startsWith('/wiki/')) return null;
  const rest = href.slice('/wiki/'.length).split('#')[0];
  if (!rest || rest.startsWith('index.php')) return null;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}

/** URL gambar dari <img>, termasuk fallback lazy-load; selalu absolut. */
export function imageSrc($img: Cheerio<any>): string | null {
  let src = $img.attr('src') || '';
  if (!src || src.startsWith('data:')) {
    src =
      $img.attr('data-src') ||
      $img.attr('srcset')?.split(',')[0]?.trim().split(/\s+/)[0] ||
      '';
  }
  return src ? absoluteUrl(src) : null;
}

const REMOVE_SELECTOR =
  'script, style, iframe, object, embed, form, input, textarea, button, link, meta, noscript, .mw-editsection';

const UNSAFE_URL = /^\s*(javascript|vbscript):/i;

/**
 * Membersihkan HTML artikel wiki supaya aman & siap dirender di frontend baru:
 *  - buang elemen berbahaya, atribut on*, URL javascript:, dan semua style inline
 *  - spoiler (display:none + toggle javascript:) -> atribut `hidden` + `data-spoiler`,
 *    supaya TIDAK terbuka saat style inline dibuang
 *  - link internal /wiki/X -> `${linkBase}/X`; redlink & link File: dilepas (jadi teks/gambar saja)
 *  - gambar: URL absolut, srcset absolut, loading="lazy"
 */
export function normalizeHtml(
  $: CheerioAPI,
  $root: Cheerio<any>,
  options: { linkBase: string }
): void {
  $root.find(REMOVE_SELECTOR).remove();

  // 1) spoiler & elemen tersembunyi -- harus SEBELUM style dibuang
  $root.find('[style]').each((_, el: any) => {
    if (/display\s*:\s*none/i.test(el.attribs.style || '')) {
      $(el).attr('hidden', '');
      if (/^toggledisplay\d+$/.test(el.attribs.id || '')) $(el).attr('data-spoiler', '');
    }
  });
  $root.find('[id^="spoilerbordertoggledisplay"]').each((_, el: any) => {
    $(el).attr('data-spoiler-toggle', el.attribs.id.replace('spoilerborder', ''));
  });

  // 1b) pola tata letak yang hanya dikenali lewat style inline -> beri class semantik
  //     (style dibuang di langkah 2, jadi harus ditandai sekarang)
  markCardRows($, $root);

  // 2) atribut: buang style & on*, netralkan URL berbahaya
  $root.find('*').each((_, el: any) => {
    for (const [name, value] of Object.entries<string>(el.attribs ?? {})) {
      if (name === 'style' || name.startsWith('on')) delete el.attribs[name];
      else if ((name === 'href' || name === 'src') && UNSAFE_URL.test(value)) {
        delete el.attribs[name];
      }
    }
  });

  // 3) link
  $root.find('a[href]').each((_, a) => {
    const $a = $(a);
    const href = $a.attr('href') ?? '';
    const isRedlink =
      $a.hasClass('new') || /redlink=1/.test(href) || href.startsWith('/wiki/index.php');
    const isFilePage = /^\/wiki\/(File|Image):/i.test(href);

    if (isRedlink || isFilePage) {
      $a.replaceWith($a.contents());
      return;
    }
    if (href.startsWith('/wiki/')) {
      $a.attr('href', `${options.linkBase}/${href.slice('/wiki/'.length)}`);
    } else if (href.startsWith('//')) {
      $a.attr('href', `https:${href}`);
    }
    if (/^https?:\/\//.test($a.attr('href') ?? '')) {
      $a.attr('rel', 'noopener noreferrer');
    }
  });

  // 4) gambar
  $root.find('img').each((_, img) => {
    const $img = $(img);
    const src = $img.attr('src');
    if (src) $img.attr('src', absoluteUrl(src));
    const srcset = $img.attr('srcset');
    if (srcset) {
      $img.attr(
        'srcset',
        srcset
          .split(',')
          .map((part) => {
            const [url, ...descriptor] = part.trim().split(/\s+/);
            return [absoluteUrl(url), ...descriptor].join(' ');
          })
          .join(', ')
      );
    }
    $img.attr('loading', 'lazy').attr('decoding', 'async');
    // foto besar (bukan ikon plot 20px) diberi class supaya bisa diberi jarak
    if (Number($img.attr('width')) >= 64) $img.addClass('wiki-photo');
  });

  // 5) "Thief:<a>Kaitou Kid</a>": spasi setelah label tebal sering hilang di markup wiki
  $root.find('b, strong').each((_, el) => {
    const $label = $(el);
    if (!/[:：]\s*$/.test($label.text())) return;
    const next: any = el.nextSibling;
    const startsWithSpace = next?.type === 'text' && /^\s/.test(next.data ?? '');
    if (next && !startsWithSpace) $label.after(' ');
  });
}

/**
 * Baris kartu bergambar, mis. daftar karakter di bagian "Featured":
 *   <div style="display:flex"> <div style="border..."><span typeof="mw:File"><img></span><br><a>Nama</a></div> ... </div>
 * Diberi class wiki-cards / wiki-card (+ wiki-cardbox / wiki-cards-title bila ada judul kotaknya).
 */
function markCardRows($: CheerioAPI, $root: Cheerio<any>) {
  $root.find('[style]').each((_, el: any) => {
    if (!/display\s*:\s*flex/i.test(el.attribs.style || '')) return;
    const $row = $(el);
    const $cards = $row.children('div').filter((_, c) => {
      const $c = $(c);
      return $c.children('span[typeof~="mw:File"]').length > 0 && $c.children('br').length > 0;
    });
    if (!$cards.length || $cards.length !== $row.children().length) return;

    $row.addClass('wiki-cards');
    $cards.addClass('wiki-card');

    // kotak berjudul: box > [judul, scroller > row]
    const $box = $row.parent().parent();
    const $title = $box.children().first();
    if ($box.length && $title.length && !$title.find('*').length && $title.text().trim()) {
      $box.addClass('wiki-cardbox');
      $title.addClass('wiki-cards-title');
    }
  });
}
