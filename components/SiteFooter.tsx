import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`shell ${styles.inner}`}>
        <p className={`display ${styles.motto}`}>One truth prevails.</p>
        <p className={styles.note}>
          This is an unofficial fan redesign. Articles, images and data come from{' '}
          <a href="https://www.detectiveconanworld.com/wiki/Main_Page" rel="noopener noreferrer">
            Detective Conan Wiki
          </a>
          , where each page can be read and edited. Detective Conan is created by Gosho Aoyama
          and published by Shogakukan.
        </p>
      </div>
    </footer>
  );
}
