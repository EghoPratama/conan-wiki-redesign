import Link from 'next/link';
import { WikiImage } from '@/components/WikiImage';
import styles from './home.module.css';
import { heroImage, type Released, type Ticket } from './view';

export function Hero({ latest, tickets }: { latest: Released | null; tickets: Ticket[] }) {
  return (
    <section className={styles.stage} aria-labelledby="hero-title">
      <div className={`shell ${styles.stageInner}`}>
        {latest ? (
          <div className={styles.hero}>
            <div className={styles.heroImage}>
              <WikiImage src={heroImage(latest.imageUrl)} alt="" priority />
            </div>
            <div className={styles.heroText}>
              <p className={styles.heroLabel}>Latest: {latest.label}</p>
              <h1 id="hero-title" className={`display ${styles.heroTitle}`}>
                {latest.title}
              </h1>
              {latest.aside && <p className={styles.heroAside}>{latest.aside}</p>}
              {latest.slug && (
                <Link href={`/wiki/${latest.slug}`} className={styles.heroButton}>
                  Open episode page
                </Link>
              )}
            </div>
          </div>
        ) : (
          <h1 id="hero-title" className={`display ${styles.heroTitle}`}>
            One truth prevails
          </h1>
        )}

        {tickets.length > 0 && (
          <div className={styles.tickets}>
            <h2 className={`display ${styles.ticketsTitle}`}>Coming up</h2>
            <ul className={styles.ticketList}>
              {tickets.map((t, i) => (
                <li
                  key={t.id}
                  className={styles.ticket}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <div className={styles.ticketMain}>
                    <p className={styles.ticketSeries}>{t.series}</p>
                    <p className={styles.ticketLabel}>{t.label}</p>
                    {t.title && <p className={styles.ticketTitle}>{t.title}</p>}
                  </div>
                  {t.note && (
                    <p
                      className={`${styles.ticketStub} ${t.today ? styles.ticketStubToday : ''}`}
                    >
                      {t.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
