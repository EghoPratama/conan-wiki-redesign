'use client';

import { useEffect, useState } from 'react';
import styles from './SiteHeader.module.css';

type Theme = 'system' | 'light' | 'dark';

const ORDER: Theme[] = ['system', 'light', 'dark'];
const LABEL: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' };

/** Skrip di layout.tsx sudah memasang data-theme sebelum render; di sini hanya sinkron state + simpan pilihan. */
function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = theme;
  try {
    if (theme === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', theme);
  } catch {
    // mode privat / penyimpanan diblokir: pilihan berlaku sampai halaman dimuat ulang
  }
}

function Icon({ theme }: { theme: Theme }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (theme === 'light')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  if (theme === 'dark')
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  // Baca pilihan tersimpan setelah mount (server tidak tahu; render awal selalu "system").
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved); // eslint-disable-line react-hooks/set-state-in-effect
    } catch {
      // abaikan
    }
  }, []);

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <button
      type="button"
      className={styles.theme}
      onClick={() => {
        setTheme(next);
        apply(next);
      }}
      aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}`}
      title={`Theme: ${LABEL[theme]}`}
    >
      <Icon theme={theme} />
    </button>
  );
}
