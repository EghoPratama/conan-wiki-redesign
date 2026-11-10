'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="shell" style={{ paddingBlock: '5rem' }}>
      <h1 className="display" style={{ fontSize: '3rem' }}>
        The wiki isn&rsquo;t responding
      </h1>
      <p style={{ marginTop: '1rem', maxWidth: '45ch', color: 'var(--ink-soft)' }}>
        Detective Conan Wiki could not be reached, so this page has nothing to show yet. Check
        your connection and try again.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: '1.5rem',
          padding: '0.7rem 1.2rem',
          font: 'inherit',
          fontWeight: 650,
          color: '#fff',
          background: 'var(--blazer)',
          border: 0,
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
