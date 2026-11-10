import Link from 'next/link';

/** Nama yang jadi link ke halaman wiki bila ada; keterangan "(Episodes …)" tetap teks biasa */
export function PersonText({ text, slug }: { text: string; slug: string | null }) {
  if (!slug) return <>{text}</>;
  const m = /^(.*?)(\s*[([].*)?$/.exec(text);
  const name = m?.[1] || text;
  const rest = m?.[2] ?? '';
  return (
    <>
      <Link href={`/wiki/${encodeURIComponent(slug)}`}>{name}</Link>
      {rest && <span style={{ color: 'var(--ink-soft)' }}>{rest}</span>}
    </>
  );
}
