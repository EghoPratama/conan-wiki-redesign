import { Suspense } from 'react';
import Link from 'next/link';
import { getStaff } from '@/lib/wiki/queries';
import { PageHeader } from '@/components/lists/PageHeader';
import { PersonText } from '@/components/extra/Person';
import { WikiImage } from '@/components/WikiImage';
import styles from '@/components/extra/extra.module.css';

export default function StaffPage() {
  return (
    <>
      <title>Staff</title>
      <PageHeader kicker="Detective Conan" title="Staff" />
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <Suspense fallback={<p aria-busy="true">Loading staff…</p>}>
          <StaffContent />
        </Suspense>
      </div>
    </>
  );
}

const href = (slug: string) => `/wiki/${encodeURIComponent(slug)}`;

async function StaffContent() {
  const { manga, voiceCast, mainStaff } = await getStaff();
  return (
    <>
      <nav className={styles.chips} aria-label="Sections">
        <a href="#manga">Manga</a>
        <a href="#voice-cast">Voice cast</a>
        <a href="#main-staff">Main staff</a>
      </nav>

      <section id="manga" className={styles.section}>
        <h2 className={styles.sectionTitle}>Manga</h2>
        {manga.map((group) => (
          <div key={group.title}>
            <h3 className={styles.subTitle}>{group.title}</h3>
            <ul className={styles.people}>
              {group.people.map((p) => (
                <li key={p.name}>{p.slug ? <Link href={href(p.slug)}>{p.name}</Link> : p.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="voice-cast" className={styles.section}>
        <h2 className={styles.sectionTitle}>Voice cast</h2>
        {voiceCast.map((group) => (
          <div key={group.title}>
            <h3 className={styles.subTitle}>{group.title}</h3>
            <ul className={styles.cast}>
              {group.entries.map((e) => (
                <li key={e.character.name} className={styles.castCard}>
                  <span className={styles.avatar}>
                    <WikiImage src={e.character.imageUrl} />
                  </span>
                  <div className={styles.castBody}>
                    <span className={styles.character}>
                      {e.character.slug ? (
                        <Link href={`/characters/${encodeURIComponent(e.character.slug)}`}>
                          {e.character.name}
                        </Link>
                      ) : (
                        e.character.name
                      )}
                    </span>
                    <span className={styles.actors}>
                      {e.actors.map((a) => (
                        <span key={a.name}>
                          {a.slug ? <Link href={href(a.slug)}>{a.name}</Link> : a.name}
                        </span>
                      ))}
                    </span>
                    {e.notes && <span className={styles.note}>{e.notes}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="main-staff" className={styles.section}>
        <h2 className={styles.sectionTitle}>Main staff</h2>
        <dl className={styles.roles}>
          {mainStaff.map((r) => (
            <div key={r.role} className={styles.role}>
              <dt>{r.role}</dt>
              <dd>
                {r.people.map((p, i) => (
                  <span key={i}>
                    <PersonText text={p.text} slug={p.slug} />
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
