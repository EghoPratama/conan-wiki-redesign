import styles from './article.module.css';

export function ArticleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <div className={styles.skelLine} style={{ width: '40%', height: '3rem' }} />
        </div>
      </div>
      <div className={`shell ${styles.layout}`}>
        <div className={styles.skelLine} style={{ height: '12rem' }} />
        <div className={styles.skelLine} style={{ height: '24rem' }} />
      </div>
    </div>
  );
}
