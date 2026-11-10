import type { ListGroup, ListNode } from '@/types/home';
import styles from './home.module.css';
import { RichText } from './RichText';

const stripColon = (s: string) => s.replace(/\s*:\s*$/, '');

function Category({ node }: { node: ListNode }) {
  return (
    <div className={styles.relCategory}>
      <h4 className={styles.relCategoryName}>{stripColon(node.text)}</h4>
      <ul className={styles.relList}>
        {node.children.map((child, i) =>
          child.children.length > 0 ? (
            // tanggal dengan beberapa rilisan di bawahnya
            <li key={i}>
              <p className={styles.relDate}>{stripColon(child.text)}</p>
              <ul className={styles.relSubList}>
                {child.children.map((leaf, j) => (
                  <li key={j}>
                    <RichText html={leaf.html} />
                  </li>
                ))}
              </ul>
            </li>
          ) : (
            <li key={i}>
              <RichText html={child.html} />
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export function Releases({ regions }: { regions: ListGroup[] }) {
  if (regions.length === 0) return null;

  return (
    <section aria-labelledby="releases-title">
      <h2 id="releases-title" className={`display ${styles.sectionTitle}`}>
        Release schedule
      </h2>
      {regions.map((region) => (
        <div key={region.heading} className={styles.relRegion}>
          <h3 className={`display ${styles.relRegionName}`}>{region.heading}</h3>
          {region.items.map((node, i) => (
            <Category key={i} node={node} />
          ))}
        </div>
      ))}
    </section>
  );
}
