import styles from '@/components/article/article.module.css';

/** Band biru di atas halaman daftar */
export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={styles.hero}>
      <div className={`shell ${styles.heroInner}`}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={`display ${styles.title}`}>{title}</h1>
        {children}
      </div>
    </header>
  );
}
