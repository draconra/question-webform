import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function SuccessPage() {
  return (
    <main style={styles.main}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            <CheckCircle2 size={80} color="#10b981" strokeWidth={1.5} />
          </div>
          
          <h1 style={styles.title}>Terima Kasih!</h1>
          
          <p style={styles.description}>
            Penilaian kesehatan IMSA Anda telah berhasil disimpan dengan aman di sistem kami. Tim medis akan segera meninjau data Anda.
          </p>
          
          <Link href="/" style={styles.btn}>
            <span>Kembali ke Beranda</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
      
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} IMSA - Penilaian Keparahan Medis Indonesia</p>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    position: 'relative',
    minHeight: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  blob1: {
    position: 'absolute',
    top: '-10%',
    left: '-5%',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
    borderRadius: '50%',
    zIndex: 0,
  },
  blob2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
    borderRadius: '50%',
    zIndex: 0,
  },
  container: {
    width: '100%',
    maxWidth: '550px',
    padding: '2rem',
    zIndex: 1,
  },
  card: {
    backgroundColor: 'white',
    padding: '4rem 2rem',
    borderRadius: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
    border: '1px solid #e2e8f0',
  },
  iconWrapper: {
    width: '120px',
    height: '120px',
    backgroundColor: '#ecfdf5',
    borderRadius: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#0f172a',
    fontFamily: "'Outfit', sans-serif",
    marginBottom: '1rem',
    letterSpacing: '-0.02em',
  },
  description: {
    fontSize: '1.125rem',
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: '3rem',
    maxWidth: '400px',
  },
  btn: {
    padding: '1rem 2rem',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '16px',
    fontSize: '1.125rem',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)',
  },
  footer: {
    position: 'absolute',
    bottom: '2rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
    zIndex: 1,
  }
};
