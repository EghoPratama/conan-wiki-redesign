'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './article.module.css';

/**
 * Isi artikel wiki (HTML yang sudah disanitasi di server). Menambahkan dua perilaku:
 *  - spoiler: elemen [data-spoiler][hidden] dibuka lewat tombol [data-spoiler-toggle]
 *  - link internal memakai router Next (tanpa muat ulang halaman)
 */
export function Article({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Tombol spoiler dari wiki hanyalah <div>/<a> tanpa href; jadikan tombol sungguhan
  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('[data-spoiler-toggle]').forEach((el) => {
      const targetId = el.dataset.spoilerToggle ?? '';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-controls', targetId);
      el.setAttribute('aria-expanded', String(!document.getElementById(targetId)?.hidden));
    });
  }, [html]);

  function toggleSpoiler(toggle: HTMLElement) {
    const target = ref.current?.querySelector<HTMLElement>(
      `[data-spoiler]#${CSS.escape(toggle.dataset.spoilerToggle ?? '')}`
    );
    if (!target) return;
    target.hidden = !target.hidden;
    toggle.setAttribute('aria-expanded', String(!target.hidden));
  }

  function onClick(event: React.MouseEvent<HTMLDivElement>) {
    const el = event.target as HTMLElement;

    const toggle = el.closest<HTMLElement>('[data-spoiler-toggle]');
    if (toggle) {
      event.preventDefault();
      toggleSpoiler(toggle);
      return;
    }

    const link = el.closest<HTMLAnchorElement>('a[href]');
    const href = link?.getAttribute('href');
    const plainClick =
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (link && href?.startsWith('/') && !href.startsWith('//') && !link.target && plainClick) {
      event.preventDefault();
      router.push(href);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const toggle = (event.target as HTMLElement).closest<HTMLElement>('[data-spoiler-toggle]');
    if (toggle) {
      event.preventDefault();
      toggleSpoiler(toggle);
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={ref}
      className={styles.body}
      onClick={onClick}
      onKeyDown={onKeyDown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
