import Link from 'next/link';
import { Heart, Shield, Activity, ArrowRight, ClipboardCheck } from 'lucide-react';

export default function Home() {
  return (
    <main style={styles.main}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      
      <div style={styles.container}>
        <div style={styles.heroSection}>
          <div style={styles.badge}>
            <Activity size={16} />
            <span>Kesehatan Digital Terpercaya</span>
          </div>
          
          <h1 style={styles.title}>
            Sistem Penilaian <span style={styles.titleAccent}>Kesehatan IMSA</span>
          </h1>
          
          <p style={styles.description}>
            Indonesian Medical Severity Assessment. Platform evaluasi tingkat keparahan medis yang dirancang untuk memberikan penilaian cepat, akurat, dan terstruktur bagi pasien.
          </p>
          
          <div style={styles.ctaGroup}>
            <Link href="/questionnaire" style={styles.primaryLink}>
              <span>Mulai Penilaian</span>
              <ArrowRight size={20} />
            </Link>
            <div style={styles.secondaryLink}>
              <Shield size={20} color="var(--primary)" />
              <span>Data Terenkripsi & Aman</span>
            </div>
          </div>
        </div>
        
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <div style={styles.iconBox}>
              <ClipboardCheck size={28} color="var(--primary)" />
            </div>
            <h3>Cepat & Mudah</h3>
            <p>Antarmuka satu pertanyaan per slide yang intuitif, dirancang untuk kenyamanan pengisian.</p>
          </div>
          
          <div style={styles.featureCard}>
            <div style={styles.iconBox}>
              <Heart size={28} color="#ec4899" />
            </div>
            <h3>Fokus Pasien</h3>
            <p>Bahasa yang sederhana dan instruksi yang jelas membantu pasien menjawab dengan jujur.</p>
          </div>
          
          <div style={styles.featureCard}>
            <div style={styles.iconBox}>
              <Activity size={28} color="#10b981" />
            </div>
            <h3>Analisis Akurat</h3>
            <p>Sistem skoring otomatis yang membantu tim medis dalam menentukan prioritas perawatan.</p>
          </div>
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
    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
    borderRadius: '50%',
    zIndex: 0,
  },
  blob2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
    borderRadius: '50%',
    zIndex: 0,
  },
  container: {
    maxWidth: '1200px',
    width: '100%',
    padding: '4rem 2rem',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5rem',
  },
  heroSection: {
    textAlign: 'center',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.5rem 1rem',
    borderRadius: '100px',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '2rem',
    border: '1px solid rgba(37, 99, 235, 0.1)',
  },
  title: {
    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.1,
    marginBottom: '1.5rem',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.03em',
  },
  titleAccent: {
    color: '#2563eb',
    position: 'relative',
  },
  description: {
    fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: '3rem',
    maxWidth: '650px',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryLink: {
    padding: '1.25rem 2.5rem',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '16px',
    fontSize: '1.25rem',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)',
  },
  secondaryLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#475569',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    width: '100%',
  },
  featureCard: {
    padding: '2.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  iconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
    marginBottom: '0.5rem',
  },
  footer: {
    padding: '2rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
    zIndex: 1,
  }
};
