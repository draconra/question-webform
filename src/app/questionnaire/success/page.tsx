import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="home-container">
      <div style={{ marginBottom: '2rem' }}>
        <svg fill="var(--success-color)" width="120" height="120" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="home-title">Terima Kasih!</h1>
      <p className="home-description">
        Penilaian kesehatan Anda telah berhasil disimpan.
      </p>
      <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none', minWidth: '160px' }}>
        Selesai
      </Link>
    </main>
  );
}
