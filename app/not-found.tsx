import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="shell" style={{ paddingBlock: '5rem' }}>
      <h1 className="display" style={{ fontSize: '3rem' }}>
        Case not found
      </h1>
      <p style={{ marginTop: '1rem', maxWidth: '45ch', color: 'var(--ink-soft)' }}>
        The wiki has no page with that name.
      </p>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/" style={{ color: 'var(--blazer)', fontWeight: 650 }}>
          Back to the home page
        </Link>
      </p>
    </div>
  );
}
