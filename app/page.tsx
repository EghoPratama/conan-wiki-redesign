import { ArticleOfTheMonth } from '@/components/home/ArticleOfTheMonth';
import { DidYouKnow } from '@/components/home/DidYouKnow';
import { Hero } from '@/components/home/Hero';
import { News } from '@/components/home/News';
import { Releases } from '@/components/home/Releases';
import { Shelf } from '@/components/home/Shelf';
import { Topics } from '@/components/home/Topics';
import { buildHomeView } from '@/components/home/view';
import styles from '@/components/home/home.module.css';
import { getHome } from '@/lib/wiki/queries';

// Server component: data diambil langsung dari lapisan data, bukan lewat /api/home.
// Hitung mundur episode berubah harian, jadi revalidate tiap jam (diatur di getHome).
export default async function HomePage() {
  const home = await getHome();
  const view = buildHomeView(home);

  return (
    <>
      <Hero latest={view.latest} tickets={view.tickets} />
      <div className={`shell ${styles.page}`}>
        <Shelf items={view.shelf} />
        <div className={styles.columns}>
          <News groups={home.news} />
          <aside className={styles.aside}>
            <Releases regions={home.releases} />
            <DidYouKnow data={home.didYouKnow} />
          </aside>
        </div>
        <ArticleOfTheMonth data={home.articleOfTheMonth} />
        <Topics groups={home.topics} />
      </div>
    </>
  );
}
