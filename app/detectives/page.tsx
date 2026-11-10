import { Suspense } from 'react';
import { getDetectives } from '@/lib/wiki/queries';
import { PageHeader } from '@/components/lists/PageHeader';
import { DetectiveGallery } from '@/components/detectives/DetectiveGallery';
import styles from '@/components/detectives/detectives.module.css';

export default function DetectivesPage() {
  return (
    <>
      <title>Detective Picture Book</title>
      <PageHeader kicker="Gosho Aoyama's" title="Detective Picture Book">
        <p className={styles.intro}>
          One famous fictional detective on the dust-jacket of every Detective Conan volume,
          with a story Aoyama recommends.
        </p>
      </PageHeader>
      <div className="shell" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <Suspense fallback={<p aria-busy="true">Loading detectives…</p>}>
          <Gallery />
        </Suspense>
      </div>
    </>
  );
}

async function Gallery() {
  const { entries } = await getDetectives();
  return <DetectiveGallery entries={entries} />;
}
