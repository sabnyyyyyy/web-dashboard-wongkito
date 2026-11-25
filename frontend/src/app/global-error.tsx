'use client';

// Special file: last-resort boundary for errors in the root layout itself. It replaces the whole
// document, so it brings its own <html>/<body> and inline styles (globals.css isn't loaded here).
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A1A1A',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <title>Terjadi kesalahan - Warkop Wong Kito</title>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 360, textAlign: 'center' }}>
          <h1 style={{ fontSize: 16, margin: 0, color: '#242424' }}>Aplikasi gagal dimuat</h1>
          <p style={{ fontSize: 12, color: '#737373' }}>{error.message || 'Terjadi kesalahan yang tidak terduga.'}</p>
          <button
            onClick={() => retry()}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '10px 0',
              border: 0,
              borderRadius: 8,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #FFB21A 0%, #F47C0B 100%)',
            }}
          >
            COBA LAGI
          </button>
        </div>
      </body>
    </html>
  );
}
