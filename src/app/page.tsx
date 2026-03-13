import Link from 'next/link';

export default function Home() {
  return (
    <main className="home-container">
      <h1 className="home-title">IMSA Questionnaire</h1>
      <p className="home-description">
        Indonesian Medical Severity Assessment. 
        Silahkan klik tombol di bawah untuk memulai penilaian kesehatan.
      </p>
      <Link href="/questionnaire" className="btn btn-primary" style={{ width: '100%', maxWidth: '400px', display: 'block', textDecoration: 'none' }}>
        Mulai (Start)
      </Link>
    </main>
  );
}
