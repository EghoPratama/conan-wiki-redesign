import { Suspense } from 'react';
import Link from 'next/link';
import { getMusic } from '@/lib/wiki/queries';
import { PageHeader } from '@/components/lists/PageHeader';
import styles from '@/components/extra/extra.module.css';

export default function MusicPage() {
  return (
    <>
      <title>Music</title>
      <PageHeader kicker="Detective Conan" title="Music" />
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <Suspense fallback={<p aria-busy="true">Loading music…</p>}>
          <MusicContent />
        </Suspense>
      </div>
    </>
  );
}

async function MusicContent() {
  const { groups } = await getMusic();
  return (
    <>
      <nav className={styles.chips} aria-label="Series">
        {groups.map((g) => (
          <a key={g.id} href={`#${g.id}`}>
            {g.title}
          </a>
        ))}
      </nav>

      {groups.map((g) => (
        <section key={g.id} id={g.id} className={styles.section}>
          <h2 className={styles.sectionTitle}>{g.title}</h2>
          {g.sections.map((s, i) => (
            // bagian pertama terbuka; sisanya (album, versi internasional) bisa dibuka sesuai kebutuhan
            <details key={s.title} className={styles.details} open={i < 2}>
              <summary>
                {s.title} <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>({s.rows.length})</span>
              </summary>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {s.headers.map((h, j) => (
                        <th key={j} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((c, k) => (
                          <td key={k}>
                            {c.slug ? (
                              <Link href={`/wiki/${encodeURIComponent(c.slug)}`}>{c.text}</Link>
                            ) : (
                              c.text
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </section>
      ))}
    </>
  );
}
