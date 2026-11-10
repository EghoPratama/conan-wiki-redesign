import Link from 'next/link';
import styles from './SiteHeader.module.css';

const NAV = [
  { href: '/characters', label: 'Characters' },
  { href: '/anime', label: 'Anime' },
  { href: '/manga', label: 'Manga' },
  { href: '/movies', label: 'Movies' },
  { href: '/music', label: 'Music' },
  { href: '/staff', label: 'Staff' },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`shell ${styles.bar}`}>
        <Link href="/" className={styles.wordmark} aria-label="Detective Conan Wiki, home">
          <span className={`display ${styles.detective}`}>detective</span>
          <span className={`display ${styles.conan}`}>conan</span>
        </Link>

        <form className={styles.search} action="/search" role="search">
          <label className="sr-only" htmlFor="site-search">
            Search the wiki
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            minLength={2}
            maxLength={100}
            placeholder="Search the wiki"
            autoComplete="off"
          />
          <button type="submit">Search</button>
        </form>

        <nav className={styles.nav} aria-label="Main">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
