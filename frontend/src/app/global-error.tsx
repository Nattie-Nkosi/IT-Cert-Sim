'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#f9fafb',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '6rem',
              fontWeight: 'bold',
              color: '#ef444440',
              marginBottom: '1rem',
            }}>
              500
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Critical Error
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '400px' }}>
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  color: '#374151',
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
